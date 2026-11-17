import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, parseBody, serverError } from "@/lib/api"
import { startSessionSchema } from "@/lib/validators"

/**
 * Start an attendance session: opens the WiFi attendance window for a class
 * right now, for `durationMinutes`. Useful for extra or rescheduled lectures.
 * Only one session per teacher can be active; starting a new one ends the old one.
 */
export async function POST(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  const parsed = await parseBody(req, startSessionSchema)
  if (!parsed.ok) return parsed.response
  const { scheduleId, durationMinutes } = parsed.data

  try {
    const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, teacherId: auth.session.id } })
    if (!schedule) return jsonError("Class not found", 404)

    const now = new Date()
    const [, session] = await prisma.$transaction([
      prisma.attendanceSession.updateMany({
        where: { isActive: true, schedule: { teacherId: auth.session.id } },
        data: { isActive: false, endedAt: now },
      }),
      prisma.attendanceSession.create({
        data: { scheduleId, expiresAt: new Date(now.getTime() + durationMinutes * 60_000) },
      }),
    ])

    return NextResponse.json({ message: "Attendance session started", session }, { status: 201 })
  } catch (error) {
    return serverError("teacher/sessions POST", error)
  }
}
