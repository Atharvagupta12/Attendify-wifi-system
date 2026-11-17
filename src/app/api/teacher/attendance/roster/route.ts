import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, parseBody, parseQuery, serverError } from "@/lib/api"
import { getRoster } from "@/lib/attendance"
import { dateKeySchema, overrideSchema } from "@/lib/validators"
import { keyToDbDate } from "@/lib/time"

const query = z.object({ scheduleId: z.string().uuid(), date: dateKeySchema })

/** Full class list for one lecture with each student's status. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  const parsed = parseQuery(req, query)
  if (!parsed.ok) return parsed.response

  try {
    const roster = await getRoster(parsed.data.scheduleId, parsed.data.date)
    if (!roster || roster.schedule.teacherId !== auth.session.id) return jsonError("Class not found", 404)
    return NextResponse.json(roster)
  } catch (error) {
    return serverError("teacher/attendance/roster GET", error)
  }
}

/** Manual override: teacher marks a student Present (e.g. phone died) or Absent (proxy suspected). */
export async function PATCH(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  const parsed = await parseBody(req, overrideSchema)
  if (!parsed.ok) return parsed.response
  const { scheduleId, studentId, date, status } = parsed.data

  try {
    const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, teacherId: auth.session.id } })
    if (!schedule) return jsonError("Class not found", 404)

    const student = await prisma.student.findFirst({ where: { id: studentId, classId: schedule.classId } })
    if (!student) return jsonError("Student is not in this class", 404)

    const dbDate = keyToDbDate(date)
    await prisma.attendance.upsert({
      where: { studentId_scheduleId_date: { studentId, scheduleId, date: dbDate } },
      update: { status, source: "MANUAL", timestamp: new Date() },
      create: { studentId, scheduleId, date: dbDate, status, source: "MANUAL" },
    })

    return NextResponse.json({ message: `Marked ${student.name} ${status.toLowerCase()}` })
  } catch (error) {
    return serverError("teacher/attendance/roster PATCH", error)
  }
}
