import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { isUniqueViolation, jsonError, parseBody, serverError } from "@/lib/api"
import { deviceSchema } from "@/lib/validators"

/** Register or replace the student's phone (e.g. new phone, or WiFi MAC randomisation changed it). */
export async function PUT(req: Request) {
  const auth = await requireRole(req, "student")
  if (!auth.ok) return auth.response

  const parsed = await parseBody(req, deviceSchema)
  if (!parsed.ok) return parsed.response
  const { macAddress, deviceName } = parsed.data

  try {
    const taken = await prisma.device.findUnique({ where: { macAddress } })
    if (taken && taken.studentId !== auth.session.id) {
      return jsonError("This device is already registered to another student", 409)
    }

    const device = await prisma.device.upsert({
      where: { studentId: auth.session.id },
      update: { macAddress, deviceName: deviceName || null },
      create: { studentId: auth.session.id, macAddress, deviceName: deviceName || null },
    })

    return NextResponse.json({
      message: "Device updated",
      device: { macAddress: device.macAddress, deviceName: device.deviceName },
    })
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("This device is already registered to another student", 409)
    return serverError("student/device", error)
  }
}
