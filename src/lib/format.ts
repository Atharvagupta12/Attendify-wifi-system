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

/** "just now", "4m ago", "2h ago" */
export function timeAgo(iso: string | Date, now: number): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 30) return "just now"
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

/** Minutes from now (in APP_TIMEZONE wall-clock) until "HH:mm" today, given the current "HH:mm". */
export function minutesUntil(target: string, current: string): number {
  const [th, tm] = target.split(":").map(Number)
  const [ch, cm] = current.split(":").map(Number)
  return th * 60 + tm - (ch * 60 + cm)
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function greeting(hour: number): string {
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
}

/** "2026-11-04" -> "4 Nov" */
export function formatShortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
}

export function percentage(present: number, total: number): number | null {
  return total === 0 ? null : Math.round((present / total) * 100)
}
