import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * All schedule logic runs in the institution's timezone, not the server's.
 * (Vercel runs in UTC; a class at 10:00 IST must still be 10:00.)
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata"

export const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const

export type DayOfWeek = (typeof DAYS)[number]

/** Current moment in APP_TIMEZONE. */
export function now(): Dayjs {
  return dayjs().tz(APP_TIMEZONE)
}

/** "YYYY-MM-DD" of a moment in APP_TIMEZONE. */
export function dateKey(d: Dayjs = now()): string {
  return d.format("YYYY-MM-DD")
}

/** "HH:mm" of a moment in APP_TIMEZONE. */
export function timeKey(d: Dayjs = now()): string {
  return d.format("HH:mm")
}

export function dayName(d: Dayjs = now()): DayOfWeek {
  return DAYS[d.day()]
}

/** Convert a "YYYY-MM-DD" key to the Date Prisma stores in a @db.Date column. */
export function keyToDbDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`)
}

/** Convert a @db.Date value back to its "YYYY-MM-DD" key. */
export function dbDateToKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Calendar date (in APP_TIMEZONE) a timestamp falls on. */
export function timestampToKey(date: Date): string {
  return dateKey(dayjs(date).tz(APP_TIMEZONE))
}

/** Parse a "YYYY-MM-DD" key as a day in APP_TIMEZONE. */
export function keyToDay(key: string): Dayjs {
  return dayjs.tz(key, APP_TIMEZONE)
}

export { formatTime12, titleCaseDay } from "./format"
