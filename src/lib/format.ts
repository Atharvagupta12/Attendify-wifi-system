/** Client-safe formatting helpers (no server env or timezone logic). */

/** "14:05" -> "2:05 PM" */
export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime12(start)} – ${formatTime12(end)}`
}

/** "MONDAY" -> "Monday" */
export function titleCaseDay(day: string): string {
  return day.charAt(0) + day.slice(1).toLowerCase()
}

/** "2026-11-17" -> "Tue, 17 Nov" (parsed as a calendar date, no timezone shift). */
export function formatDateLabel(key: string, today?: string): string {
  if (today && key === today) return "Today"
  const [y, m, d] = key.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
}

export function percentage(present: number, total: number): number | null {
  return total === 0 ? null : Math.round((present / total) * 100)
}
