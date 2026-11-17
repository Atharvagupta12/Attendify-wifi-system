import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, serverError } from "@/lib/api"
import { deriveStatus, listOccurrences, occurrenceState } from "@/lib/attendance"
import { dateKey, dayName, dbDateToKey, keyToDbDate, now, timestampToKey } from "@/lib/time"

const HISTORY_DAYS = 30

/** Everything the student dashboard needs: stats, per-subject breakdown, history, upcoming lectures, device. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "student")
  if (!auth.ok) return auth.response

  try {
    const student = await prisma.student.findUnique({
      where: { id: auth.session.id },
      include: {
        class: true,
        device: true,
        attendance: { where: { date: { gte: keyToDbDate(dateKey(now().subtract(HISTORY_DAYS, "day"))) } } },
      },
    })
    if (!student) return jsonError("Student not found", 404)

    const schedules = await prisma.schedule.findMany({
      where: { classId: student.classId },
      include: { subject: true, teacher: { select: { name: true } }, sessions: true },
    })
    const sessions = schedules.flatMap((s) => s.sessions)
    const byId = new Map(schedules.map((s) => [s.id, s]))

    const n = now()
    const today = dateKey(n)
    const joined = timestampToKey(student.createdAt)
    const windowStart = dateKey(n.subtract(HISTORY_DAYS - 1, "day"))
    const from = joined > windowStart ? joined : windowStart

    // --- History (derived: a finished lecture with no record = Absent) ---
    const recordMap = new Map(student.attendance.map((a) => [`${a.scheduleId}|${dbDateToKey(a.date)}`, a]))
    const history = listOccurrences(schedules, sessions, from, today)
      .map(({ scheduleId, date }) => {
        const s = byId.get(scheduleId)!
        const state = occurrenceState(s, date, s.sessions)
        const rec = recordMap.get(`${scheduleId}|${date}`)
        const status = deriveStatus(rec?.status, state)
        return status
          ? {
              scheduleId,
              date,
              subject: s.subject.subjectName,
              teacher: s.teacher.name,
              startTime: s.startTime,
              endTime: s.endTime,
              status,
              markedAt: rec?.timestamp ?? null,
            }
          : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => (a.date === b.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date)))

    const counted = history.filter((h) => h.status !== "Pending")
    const present = counted.filter((h) => h.status === "Present").length

    const subjects = new Map<string, { present: number; total: number }>()
    for (const h of counted) {
      const entry = subjects.get(h.subject) ?? { present: 0, total: 0 }
      entry.total++
      if (h.status === "Present") entry.present++
      subjects.set(h.subject, entry)
    }

    // --- Upcoming: walk the next 7 days so the week wraps correctly (Sat -> Mon) ---
    const upcoming: {
      scheduleId: string
      date: string
      day: string
      subject: string
      teacher: string
      startTime: string
      endTime: string
      live: boolean
    }[] = []
    for (let i = 0; i < 7 && upcoming.length < 5; i++) {
      const d = n.add(i, "day")
      const key = dateKey(d)
      schedules
        .filter((s) => s.dayOfWeek === dayName(d) || (i === 0 && s.sessions.some((x) => x.isActive)))
        .map((s) => ({ s, state: occurrenceState(s, key, s.sessions) }))
        .filter(({ state }) => state !== "completed")
        .sort((a, b) => a.s.startTime.localeCompare(b.s.startTime))
        .forEach(({ s, state }) =>
          upcoming.push({
            scheduleId: s.id,
            date: key,
            day: dayName(d),
            subject: s.subject.subjectName,
            teacher: s.teacher.name,
            startTime: s.startTime,
            endTime: s.endTime,
            live: state === "live",
          }),
        )
    }

    const live = upcoming.find((u) => u.live && u.date === today)
    const liveRecord = live && history.find((h) => h.date === today && h.scheduleId === live.scheduleId)

    return NextResponse.json({
      today,
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        class: `${student.class.className}-${student.class.section}`,
      },
      device: student.device
        ? { macAddress: student.device.macAddress, deviceName: student.device.deviceName }
        : null,
      stats: {
        periodDays: HISTORY_DAYS,
        totalClasses: counted.length,
        present,
        absent: counted.length - present,
        attendancePercentage: counted.length === 0 ? null : Math.round((present / counted.length) * 100),
      },
      subjectStats: [...subjects.entries()].map(([subject, v]) => ({
        subject,
        ...v,
        percentage: Math.round((v.present / v.total) * 100),
      })),
      liveClass: live ? { ...live, status: liveRecord?.status ?? "Pending" } : null,
      upcoming: upcoming.filter((u) => !u.live).slice(0, 4),
      history,
    })
  } catch (error) {
    return serverError("student/overview", error)
  }
}
