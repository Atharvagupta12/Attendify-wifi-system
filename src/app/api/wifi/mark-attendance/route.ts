import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { jsonError, parseBody, serverError } from "@/lib/api"
import { scanSchema, normalizeMac } from "@/lib/validators"
import { getActiveSchedules } from "@/lib/attendance"
import { dateKey, keyToDbDate } from "@/lib/time"

/**
 * Called by the classroom ESP32 with the MAC addresses of phones connected to it.
 *
 *   POST /api/wifi/mark-attendance
 *   x-device-key: <DEVICE_API_KEY>
 *   { "macAddresses": ["AA:BB:CC:DD:EE:FF", ...], "deviceId": "room-101" }
 *
 * Each recognised student whose class has an open attendance window
 * (scheduled slot in progress, or a teacher-started session) is marked Present.
 * Safe to call repeatedly: already-marked students are skipped.
 */
function isAuthorizedDevice(req: Request): boolean {
  const expected = process.env.DEVICE_API_KEY
  const provided = req.headers.get("x-device-key")
  if (!expected || !provided) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  if (!process.env.DEVICE_API_KEY) {
    return jsonError("Device ingestion is not configured on the server (DEVICE_API_KEY)", 503)
  }
  if (!isAuthorizedDevice(req)) return jsonError("Invalid device key", 401)

  const parsed = await parseBody(req, scanSchema)
  if (!parsed.ok) return parsed.response

  const macs = [...new Set(parsed.data.macAddresses.map(normalizeMac).filter((m): m is string => !!m))]
  if (macs.length === 0) return jsonError("No valid MAC addresses provided", 400)

  try {
    const active = await getActiveSchedules()
    if (active.length === 0) {
      return NextResponse.json({ message: "No active class right now", marked: [], skipped: macs.length })
    }

    const devices = await prisma.device.findMany({
      where: { macAddress: { in: macs } },
      include: { student: { select: { id: true, name: true, classId: true } } },
    })

    const today = keyToDbDate(dateKey())
    const candidates = devices.flatMap(({ student }) => {
      const schedule = active.find((s) => s.classId === student.classId)
      return schedule ? [{ student, scheduleId: schedule.id }] : []
    })

    if (candidates.length === 0) {
      return NextResponse.json({
        message: "No registered students for the active class",
        marked: [],
        alreadyMarked: 0,
        unknownDevices: macs.length - devices.length,
      })
    }

    // One query for "already marked" instead of one per device.
    const existing = await prisma.attendance.findMany({
      where: {
        date: today,
        OR: candidates.map((c) => ({ studentId: c.student.id, scheduleId: c.scheduleId })),
      },
      select: { studentId: true, scheduleId: true },
    })
    const done = new Set(existing.map((e) => `${e.studentId}|${e.scheduleId}`))
    const toMark = candidates.filter((c) => !done.has(`${c.student.id}|${c.scheduleId}`))

    if (toMark.length > 0) {
      await prisma.attendance.createMany({
        data: toMark.map((c) => ({
          studentId: c.student.id,
          scheduleId: c.scheduleId,
          date: today,
          status: "Present",
          source: "WIFI",
        })),
        skipDuplicates: true, // concurrent scans from two devices can't double-insert
      })
    }

    return NextResponse.json({
      message: "Attendance processed",
      marked: toMark.map((c) => c.student.name),
      alreadyMarked: candidates.length - toMark.length,
      unknownDevices: macs.length - devices.length,
    })
  } catch (error) {
    return serverError("wifi/mark-attendance", error)
  }
}
