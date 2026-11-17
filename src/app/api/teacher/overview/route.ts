import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { serverError } from "@/lib/api"
import { getTeacherOccurrences, isSessionLive, occurrenceState } from "@/lib/attendance"
import { dateKey, dayName, keyToDbDate, now, timeKey } from "@/lib/time"

/** Everything the teacher dashboard needs in one request. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response
  const teacherId = auth.session.id

  try {
    const n = now()
    const today = dateKey(n)

    const [schedules, recent] = await Promise.all([
      prisma.schedule.findMany({
        where: { teacherId },
        include: {
          subject: true,
          class: { include: { _count: { select: { students: true } } } },
          sessions: { where: { isActive: true, expiresAt: { gt: new Date() } } },
          _count: { select: { attendance: { where: { date: keyToDbDate(today), status: "Present" } } } },
        },
      }),
      getTeacherOccurrences(teacherId, dateKey(n.subtract(29, "day")), today),
    ])

    const liveSession = schedules
      .flatMap((s) => s.sessions.map((sess) => ({ sess, s })))
      .find(({ sess }) => isSessionLive(sess))

    const todays = schedules
      .filter((s) => s.dayOfWeek === dayName(n) || s.sessions.length > 0)
      .map((s) => ({
        scheduleId: s.id,
        subject: s.subject.subjectName,
        class: `${s.class.className}-${s.class.section}`,
        startTime: s.startTime,
        endTime: s.endTime,
        state: occurrenceState(s, today, s.sessions),
        present: s._count.attendance,
        total: s.class._count.students,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    const completed = recent.filter((o) => o.state === "completed")
    const presentSum = completed.reduce((sum, o) => sum + o.present, 0)
    const totalSum = completed.reduce((sum, o) => sum + o.total, 0)

    // Daily attendance % for the trend chart (completed lectures, last 14 days).
    const trendFrom = dateKey(n.subtract(13, "day"))
    const daily = new Map<string, { present: number; total: number }>()
    for (const o of completed) {
      if (o.date < trendFrom) continue
      const d = daily.get(o.date) ?? { present: 0, total: 0 }
      d.present += o.present
      d.total += o.total
      daily.set(o.date, d)
    }
    const trend = [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, ...d, percentage: d.total === 0 ? 0 : Math.round((d.present / d.total) * 100) }))

    // Latest check-ins today across the teacher's lectures (live feed).
    const feedRows = await prisma.attendance.findMany({
      where: { date: keyToDbDate(today), status: "Present", schedule: { teacherId } },
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { student: { select: { name: true } }, schedule: { include: { subject: true } } },
    })
    const feed = feedRows.map((r) => ({
      id: r.id,
      name: r.student.name,
      subject: r.schedule.subject.subjectName,
      source: r.source,
      at: r.timestamp,
    }))

    const classIds = new Set(schedules.map((s) => s.classId))
    const totalStudents = schedules
      .filter((s, i, arr) => arr.findIndex((x) => x.classId === s.classId) === i)
      .reduce((sum, s) => sum + s.class._count.students, 0)

    return NextResponse.json({
      today,
      nowTime: timeKey(n),
      todaysClasses: todays,
      activeSession: liveSession
        ? {
            id: liveSession.sess.id,
            scheduleId: liveSession.s.id,
            subject: liveSession.s.subject.subjectName,
            class: `${liveSession.s.class.className}-${liveSession.s.class.section}`,
            expiresAt: liveSession.sess.expiresAt,
            startedAt: liveSession.sess.createdAt,
          }
        : null,
      stats: {
        weeklyClasses: schedules.length,
        classes: classIds.size,
        students: totalStudents,
        lecturesHeld30d: completed.length,
        averageAttendance: totalSum === 0 ? null : Math.round((presentSum / totalSum) * 100),
      },
      recent: recent.slice(0, 6),
      trend,
      feed,
    })
  } catch (error) {
    return serverError("teacher/overview", error)
  }
}
