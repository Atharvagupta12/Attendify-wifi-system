import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, parseBody, serverError } from "@/lib/api"
import { scheduleSchema } from "@/lib/validators"
import { DAYS } from "@/lib/time"

/** The logged-in teacher's weekly timetable. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  try {
    const schedules = await prisma.schedule.findMany({
      where: { teacherId: auth.session.id },
      include: { class: { include: { _count: { select: { students: true } } } }, subject: true },
    })

    const data = schedules
      .map((s) => ({
        scheduleId: s.id,
        subject: s.subject.subjectName,
        subjectCode: s.subject.subjectCode,
        class: `${s.class.className}-${s.class.section}`,
        studentCount: s.class._count.students,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
      .sort((a, b) => {
        // Monday-first week order, then by time.
        const order = (d: string) => (DAYS.indexOf(d as (typeof DAYS)[number]) + 6) % 7
        return order(a.dayOfWeek) - order(b.dayOfWeek) || a.startTime.localeCompare(b.startTime)
      })

    return NextResponse.json({ data })
  } catch (error) {
    return serverError("teacher/schedules GET", error)
  }
}

async function generateSubjectCode(name: string): Promise<string> {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X")
  for (let i = 0; i < 20; i++) {
    const code = `${prefix}${Math.floor(100 + Math.random() * 900)}`
    if (!(await prisma.subject.findUnique({ where: { subjectCode: code } }))) return code
  }
  return `${prefix}${Date.now().toString().slice(-6)}`
}

/** Create a weekly lecture slot. Class and subject are created on first use. */
export async function POST(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  const parsed = await parseBody(req, scheduleSchema)
  if (!parsed.ok) return parsed.response
  const { className, section, subjectName, dayOfWeek, startTime, endTime } = parsed.data
  const teacherId = auth.session.id

  try {
    // Two slots overlap when each starts before the other ends ("HH:mm" strings compare correctly).
    const overlap = { dayOfWeek, startTime: { lt: endTime }, endTime: { gt: startTime } }

    const existingClass = await prisma.class.findUnique({ where: { className_section: { className, section } } })

    const [classClash, teacherClash] = await Promise.all([
      existingClass
        ? prisma.schedule.findFirst({ where: { classId: existingClass.id, ...overlap }, include: { subject: true } })
        : null,
      prisma.schedule.findFirst({ where: { teacherId, ...overlap }, include: { class: true } }),
    ])
    if (classClash) {
      return jsonError(
        `${className}-${section} already has ${classClash.subject.subjectName} from ${classClash.startTime} to ${classClash.endTime}`,
        409,
      )
    }
    if (teacherClash) {
      return jsonError(
        `You already teach ${teacherClash.class.className}-${teacherClash.class.section} from ${teacherClash.startTime} to ${teacherClash.endTime}`,
        409,
      )
    }

    // Only create the class once the slot is known to be valid.
    const cls =
      existingClass ??
      (await prisma.class.upsert({
        where: { className_section: { className, section } },
        update: {},
        create: { className, section },
      }))

    const subject =
      (await prisma.subject.findFirst({ where: { subjectName: { equals: subjectName, mode: "insensitive" } } })) ??
      (await prisma.subject.create({ data: { subjectName, subjectCode: await generateSubjectCode(subjectName) } }))

    const schedule = await prisma.schedule.create({
      data: { teacherId, classId: cls.id, subjectId: subject.id, dayOfWeek, startTime, endTime },
    })

    return NextResponse.json({ message: "Class scheduled", scheduleId: schedule.id }, { status: 201 })
  } catch (error) {
    return serverError("teacher/schedules POST", error)
  }
}
