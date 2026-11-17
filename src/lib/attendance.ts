import type { Prisma } from "@prisma/client"
import { prisma } from "./prisma"
import {
  dateKey,
  dayName,
  dbDateToKey,
  keyToDay,
  now,
  timeKey,
  timestampToKey,
} from "./time"

/*
 * Attendance model
 * ----------------
 * A Schedule is a weekly slot. Each concrete lecture is an "occurrence":
 * (scheduleId, date). Occurrences come from
 *   1. the weekly slot (every matching weekday since the schedule was created), and
 *   2. teacher-started sessions (an extra/rescheduled lecture on that date).
 *
 * Only "Present" (and manual "Absent") rows are stored. For a finished
 * occurrence, a student without a row is Absent. This keeps absences exact
 * without needing a cron job to write them.
 */

export type OccurrenceState = "upcoming" | "live" | "completed"
export type AttendanceStatus = "Present" | "Absent" | "Pending"

type ScheduleLike = {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  createdAt: Date
}

type SessionLike = {
  scheduleId: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
}

export type Occurrence = { scheduleId: string; date: string }

export function isSessionLive(session: SessionLike, at: Date = new Date()): boolean {
  return session.isActive && session.expiresAt > at
}

/** Every occurrence of `schedules` between two date keys (inclusive). */
export function listOccurrences(
  schedules: ScheduleLike[],
  sessions: SessionLike[],
  fromKey: string,
  toKey: string,
): Occurrence[] {
  const seen = new Set<string>()
  const out: Occurrence[] = []
  const add = (scheduleId: string, date: string) => {
    const k = `${scheduleId}|${date}`
    if (!seen.has(k)) {
      seen.add(k)
      out.push({ scheduleId, date })
    }
  }

  for (let d = keyToDay(fromKey); dateKey(d) <= toKey; d = d.add(1, "day")) {
    const key = dateKey(d)
    const weekday = dayName(d)
    for (const s of schedules) {
      if (s.dayOfWeek === weekday && key >= timestampToKey(s.createdAt)) add(s.id, key)
    }
  }

  const ids = new Set(schedules.map((s) => s.id))
  for (const sess of sessions) {
    const key = timestampToKey(sess.createdAt)
    if (ids.has(sess.scheduleId) && key >= fromKey && key <= toKey) add(sess.scheduleId, key)
  }

  return out
}

/** Whether a given occurrence hasn't started, is in progress, or is over. */
export function occurrenceState(
  schedule: ScheduleLike,
  date: string,
  sessions: SessionLike[] = [],
): OccurrenceState {
  const n = now()
  const today = dateKey(n)
  if (date < today) return "completed"
  if (date > today) return "upcoming"

  if (sessions.some((s) => s.scheduleId === schedule.id && isSessionLive(s))) return "live"

  const t = timeKey(n)
  if (schedule.dayOfWeek !== dayName(n)) {
    // Extra lecture on a non-scheduled day: it existed only through a session that has ended.
    return "completed"
  }
  if (t < schedule.startTime) return "upcoming"
  if (t < schedule.endTime) return "live"
  return "completed"
}

/** Derive the status of one student for one occurrence. */
export function deriveStatus(
  recordStatus: string | undefined,
  state: OccurrenceState,
): AttendanceStatus | null {
  if (recordStatus === "Present" || recordStatus === "Absent") return recordStatus
  if (state === "completed") return "Absent"
  if (state === "live") return "Pending"
  return null // upcoming: not counted
}

/**
 * Schedules whose attendance window is open right now: the weekly slot is in
 * progress, or the teacher has an active session for it.
 */
export async function getActiveSchedules(where: Prisma.ScheduleWhereInput = {}) {
  const n = now()
  const t = timeKey(n)

  const [bySlot, sessions] = await Promise.all([
    prisma.schedule.findMany({
      where: { ...where, dayOfWeek: dayName(n), startTime: { lte: t }, endTime: { gt: t } },
    }),
    prisma.attendanceSession.findMany({
      where: { isActive: true, expiresAt: { gt: new Date() }, schedule: where },
      include: { schedule: true },
    }),
  ])

  const map = new Map(bySlot.map((s) => [s.id, s]))
  for (const sess of sessions) map.set(sess.schedule.id, sess.schedule)
  return [...map.values()]
}

/** Full class roster for one occurrence, with each student's derived status. */
export async function getRoster(scheduleId: string, date: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      subject: true,
      class: { include: { students: { orderBy: { rollNumber: "asc" } } } },
      sessions: true,
      attendance: { where: { date: new Date(`${date}T00:00:00.000Z`) } },
    },
  })
  if (!schedule) return null

  const state = occurrenceState(schedule, date, schedule.sessions)
  const byStudent = new Map(schedule.attendance.map((a) => [a.studentId, a]))

  const students = schedule.class.students
    // Students who joined after this lecture are not expected to attend it.
    .filter((st) => timestampToKey(st.createdAt) <= date)
    .map((st) => {
      const rec = byStudent.get(st.id)
      return {
        studentId: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        status: deriveStatus(rec?.status, state) ?? "Pending",
        source: rec?.source ?? null,
        markedAt: rec?.timestamp ?? null,
      }
    })

  const present = students.filter((s) => s.status === "Present").length

  return {
    schedule: {
      id: schedule.id,
      teacherId: schedule.teacherId,
      subject: schedule.subject.subjectName,
      class: `${schedule.class.className}-${schedule.class.section}`,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    },
    date,
    state,
    summary: { present, absent: students.length - present, total: students.length },
    students,
  }
}

/** Attendance summary (present/total) for every occurrence of a teacher's schedules in a range. */
export async function getTeacherOccurrences(teacherId: string, fromKey: string, toKey: string) {
  const schedules = await prisma.schedule.findMany({
    where: { teacherId },
    include: {
      subject: true,
      class: { include: { students: { select: { id: true, createdAt: true } } } },
      sessions: true,
    },
  })
  const occurrences = listOccurrences(
    schedules,
    schedules.flatMap((s) => s.sessions),
    fromKey,
    toKey,
  )

  const counts = await prisma.attendance.groupBy({
    by: ["scheduleId", "date"],
    where: {
      scheduleId: { in: schedules.map((s) => s.id) },
      status: "Present",
      date: { gte: new Date(`${fromKey}T00:00:00.000Z`), lte: new Date(`${toKey}T00:00:00.000Z`) },
    },
    _count: { _all: true },
  })
  const presentMap = new Map(counts.map((c) => [`${c.scheduleId}|${dbDateToKey(c.date)}`, c._count._all]))
  const byId = new Map(schedules.map((s) => [s.id, s]))

  return occurrences
    .map(({ scheduleId, date }) => {
      const s = byId.get(scheduleId)!
      const state = occurrenceState(s, date, s.sessions)
      return {
        scheduleId,
        date,
        state,
        subject: s.subject.subjectName,
        class: `${s.class.className}-${s.class.section}`,
        startTime: s.startTime,
        endTime: s.endTime,
        present: presentMap.get(`${scheduleId}|${date}`) ?? 0,
        total: s.class.students.filter((st) => timestampToKey(st.createdAt) <= date).length,
      }
    })
    .filter((o) => o.state !== "upcoming")
    .sort((a, b) => (a.date === b.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date)))
}
