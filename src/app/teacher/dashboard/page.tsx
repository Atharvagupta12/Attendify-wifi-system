"use client"

import { useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  Clock,
  PlayCircle,
  Radio,
  Square,
  TrendingUp,
  UserPen,
  Users,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSkeleton, EmptyState, PageHeader, Panel, StatCard, StatusBadge, selectClass } from "@/components/common"
import { useUser } from "@/components/app-shell"
import { Avatar } from "@/components/avatar"
import { AnimatedNumber } from "@/components/animated-number"
import { TrendChart } from "@/components/charts"
import { LiveDot, RadarPulse } from "@/components/radar"
import { api, errorMessage } from "@/lib/client"
import { useResource } from "@/lib/use-resource"
import { useNow } from "@/lib/use-now"
import { formatDateLabel, formatDuration, formatTime12, formatTimeRange, greeting, minutesUntil, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

type TodayClass = {
  scheduleId: string
  subject: string
  class: string
  startTime: string
  endTime: string
  state: "upcoming" | "live" | "completed"
  present: number
  total: number
}

type Overview = {
  today: string
  nowTime: string
  todaysClasses: TodayClass[]
  activeSession: {
    id: string
    scheduleId: string
    subject: string
    class: string
    expiresAt: string
    startedAt: string
  } | null
  stats: { weeklyClasses: number; classes: number; students: number; lecturesHeld30d: number; averageAttendance: number | null }
  recent: {
    scheduleId: string
    date: string
    subject: string
    class: string
    startTime: string
    endTime: string
    present: number
    total: number
  }[]
  trend: { date: string; percentage: number; present: number; total: number }[]
  feed: { id: string; name: string; subject: string; source: string; at: string }[]
}

export default function TeacherDashboard() {
  const user = useUser()
  // Live view: refresh every 10 s so WiFi check-ins appear without reloading.
  const { data, reload } = useResource<Overview>("/api/teacher/overview", 10_000)
  const now = useNow(1000)
  const [busy, setBusy] = useState<string | null>(null)
  const [duration, setDuration] = useState(60)

  const startSession = async (scheduleId: string) => {
    setBusy(scheduleId)
    try {
      await api("/api/teacher/sessions", { method: "POST", body: { scheduleId, durationMinutes: duration } })
      toast.success(`Attendance is open for ${duration} minutes`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const stopSession = async (id: string) => {
    setBusy(id)
    try {
      await api(`/api/teacher/sessions/${id}`, { method: "DELETE" })
      toast.success("Attendance session closed")
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (!data) return <DashboardSkeleton />

  const { stats, activeSession } = data
  const liveSlot = data.todaysClasses.find((c) => c.state === "live")
  const sessionClass = activeSession && data.todaysClasses.find((c) => c.scheduleId === activeSession.scheduleId)
  const nextUp = data.todaysClasses.find((c) => c.state === "upcoming")
  const firstName = user.name.split(" ")[0]

  return (
    <>
      <PageHeader
        eyebrow={formatDateLabel(data.today)}
        title={`${greeting(new Date(now).getHours())}, ${firstName}`}
        description={
          data.todaysClasses.length === 0
            ? "No lectures on your timetable today."
            : `${data.todaysClasses.length} lecture${data.todaysClasses.length === 1 ? "" : "s"} today · ${stats.students} students across ${stats.classes} class${stats.classes === 1 ? "" : "es"}`
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/teacher/schedule">
                <CalendarPlus /> Schedule
              </Link>
            </Button>
            <Button asChild>
              <Link href="/teacher/attendance">
                <ClipboardCheck /> Reports
              </Link>
            </Button>
          </>
        }
      />

      {/* ---------- Contextual hero ---------- */}
      {activeSession ? (
        <LiveHero
          title={`${activeSession.subject} · ${activeSession.class}`}
          subtitle="Attendance session is live. Phones on the classroom WiFi are being marked present."
          present={sessionClass?.present ?? 0}
          total={sessionClass?.total ?? 0}
          rosterHref={`/teacher/attendance?scheduleId=${activeSession.scheduleId}&date=${data.today}`}
          remaining={Math.max(0, new Date(activeSession.expiresAt).getTime() - now)}
          span={new Date(activeSession.expiresAt).getTime() - new Date(activeSession.startedAt).getTime()}
          action={
            <Button variant="destructive" disabled={busy === activeSession.id} onClick={() => stopSession(activeSession.id)}>
              <Square className="fill-current" /> Stop session
            </Button>
          }
        />
      ) : liveSlot ? (
        <LiveHero
          title={`${liveSlot.subject} · ${liveSlot.class}`}
          subtitle={`In progress until ${formatTime12(liveSlot.endTime)}. Attendance opened automatically for this slot.`}
          present={liveSlot.present}
          total={liveSlot.total}
          rosterHref={`/teacher/attendance?scheduleId=${liveSlot.scheduleId}&date=${data.today}`}
        />
      ) : nextUp ? (
        <div className="mb-8 flex animate-rise flex-col gap-5 rounded-2xl border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              Next up · in {formatDuration(Math.max(1, minutesUntil(nextUp.startTime, data.nowTime)))}
            </p>
            <p className="text-lg font-semibold tracking-tight">
              {nextUp.subject} · {nextUp.class}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTimeRange(nextUp.startTime, nextUp.endTime)} · attendance opens automatically
            </p>
          </div>
          <Button variant="outline" disabled={busy === nextUp.scheduleId} onClick={() => startSession(nextUp.scheduleId)}>
            <PlayCircle /> Open early
          </Button>
        </div>
      ) : null}

      {/* ---------- Stats ---------- */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} tone="primary" label="Weekly lectures" value={<AnimatedNumber value={stats.weeklyClasses} />} hint={`${stats.classes} class${stats.classes === 1 ? "" : "es"}`} />
        <StatCard icon={Users} tone="default" label="Students" value={<AnimatedNumber value={stats.students} />} hint="across your classes" />
        <StatCard icon={ClipboardCheck} tone="default" label="Lectures held" value={<AnimatedNumber value={stats.lecturesHeld30d} />} hint="last 30 days" />
        <StatCard
          icon={TrendingUp}
          tone={stats.averageAttendance === null ? "default" : stats.averageAttendance >= 75 ? "success" : "danger"}
          label="Avg. attendance"
          value={stats.averageAttendance === null ? "–" : <AnimatedNumber value={stats.averageAttendance} suffix="%" />}
          hint="last 30 days"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          {/* Trend */}
          <Panel title="Attendance trend" description="Daily attendance across your lectures, last 14 days">
            {data.trend.length < 2 ? (
              <EmptyState icon={TrendingUp} title="Not enough data yet" description="The trend appears after a couple of lecture days." />
            ) : (
              <TrendChart data={data.trend} />
            )}
          </Panel>

          {/* Today timeline */}
          <Panel
            title="Today's lectures"
            description="Open attendance early with a session, e.g. for an extra lecture"
            action={
              <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">Session</span>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={cn(selectClass, "h-8 w-auto")}>
                  {[15, 30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </label>
            }
          >
            {data.todaysClasses.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="No lectures today"
                description="Enjoy the break, or add a lecture to your weekly schedule."
                action={
                  <Button asChild size="sm">
                    <Link href="/teacher/schedule">Add lecture</Link>
                  </Button>
                }
              />
            ) : (
              <ol className="relative">
                {data.todaysClasses.map((c, i) => {
                  const isSession = activeSession?.scheduleId === c.scheduleId
                  const pct = c.total ? Math.round((c.present / c.total) * 100) : 0
                  return (
                    <li key={c.scheduleId} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* rail */}
                      {i < data.todaysClasses.length - 1 && <span className="absolute top-7 bottom-0 left-[15px] w-px bg-border" />}
                      <span
                        className={cn(
                          "relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                          c.state === "live" ? "border-success text-success" : c.state === "completed" ? "border-primary/40 text-primary" : "border-border text-muted-foreground",
                        )}
                      >
                        {c.state === "live" ? <Wifi className="size-3.5" /> : c.state === "completed" ? <ClipboardCheck className="size-3.5" /> : <Clock className="size-3.5" />}
                      </span>
                      <div className={cn("min-w-0 flex-1 rounded-xl border p-4 transition-colors", c.state === "live" && "border-success/30 bg-success/5")}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="font-medium">{c.subject}</p>
                          <StatusBadge status={c.state} />
                          <span className="text-sm text-muted-foreground">
                            {c.class} · {formatTimeRange(c.startTime, c.endTime)}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="flex min-w-40 flex-1 items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm tabular text-muted-foreground">
                              <span className="font-semibold text-foreground">{c.present}</span>/{c.total}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isSession && c.state !== "live" && (
                              <Button size="sm" variant="ghost" disabled={busy === c.scheduleId} onClick={() => startSession(c.scheduleId)}>
                                <PlayCircle /> Session
                              </Button>
                            )}
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/teacher/attendance?scheduleId=${c.scheduleId}&date=${data.today}`}>
                                Roster <ChevronRight />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {/* Live feed */}
          <Panel
            title={
              <span className="flex items-center gap-2">
                Live check-ins {(activeSession || liveSlot) && <LiveDot />}
              </span>
            }
            description="Today, newest first"
          >
            {data.feed.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <RadarPulse size={96} />
                <p className="mt-4 text-sm font-medium">Waiting for devices…</p>
                <p className="mt-1 text-xs text-muted-foreground">Check-ins appear here the moment a phone is detected.</p>
              </div>
            ) : (
              <ul className="-mx-2 flex flex-col">
                {data.feed.map((f, i) => (
                  <li
                    key={f.id}
                    className={cn("flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60", i === 0 && "animate-rise")}
                  >
                    <Avatar name={f.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{f.subject}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title={f.source === "WIFI" ? "Detected on WiFi" : "Marked by teacher"}>
                      {f.source === "WIFI" ? <Wifi className="size-3" /> : <UserPen className="size-3" />}
                      {timeAgo(f.at, now)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Recent */}
          <Panel
            title="Recent lectures"
            action={
              <Link href="/teacher/attendance" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                All <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {data.recent.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No lectures yet" description="Reports appear once lectures are held." />
            ) : (
              <ul className="-mx-2 flex flex-col">
                {data.recent.map((r) => {
                  const pct = r.total ? Math.round((r.present / r.total) * 100) : 0
                  return (
                    <li key={`${r.scheduleId}-${r.date}`}>
                      <Link
                        href={`/teacher/attendance?scheduleId=${r.scheduleId}&date=${r.date}`}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                      >
                        <MiniRing value={pct} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {r.subject} <span className="text-muted-foreground">· {r.class}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateLabel(r.date, data.today)}</p>
                        </div>
                        <span className="text-sm tabular text-muted-foreground">
                          {r.present}/{r.total}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}

function LiveHero({
  title,
  subtitle,
  present,
  total,
  rosterHref,
  remaining,
  span,
  action,
}: {
  title: string
  subtitle: string
  present: number
  total: number
  rosterHref: string
  remaining?: number
  span?: number
  action?: React.ReactNode
}) {
  const pct = total ? Math.round((present / total) * 100) : 0
  const mm = remaining !== undefined ? Math.floor(remaining / 60000) : 0
  const ss = remaining !== undefined ? Math.floor((remaining % 60000) / 1000) : 0

  return (
    <div className="relative mb-8 animate-rise overflow-hidden rounded-2xl border border-success/25 bg-card shadow-soft">
      <div className="absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_50%,color-mix(in_oklch,var(--success)_12%,transparent),transparent)]" />
      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <RadarPulse size={132} dots={present} tone="success" className="mx-auto md:mx-0" />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
            <Radio className="size-3.5" /> Live now
          </span>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Checked in</p>
              <p className="text-2xl font-semibold tracking-tight tabular">
                <AnimatedNumber value={present} />
                <span className="text-base font-normal text-muted-foreground">/{total}</span>
                <span className="ml-2 text-sm font-medium text-success">{pct}%</span>
              </p>
            </div>
            {remaining !== undefined && (
              <div className="min-w-44 flex-1">
                <p className="text-xs text-muted-foreground">Closes in</p>
                <p className="font-mono text-2xl font-semibold tabular">
                  {mm}:{String(ss).padStart(2, "0")}
                </p>
                {span ? (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success transition-[width] duration-1000 ease-linear" style={{ width: `${(remaining / span) * 100}%` }} />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 md:flex-col">
          <Button asChild variant="outline">
            <Link href={rosterHref}>
              <Users /> Live roster
            </Link>
          </Button>
          {action}
        </div>
      </div>
    </div>
  )
}

function MiniRing({ value }: { value: number }) {
  const r = 14
  const c = 2 * Math.PI * r
  const color = value >= 75 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--danger)"
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--muted)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span className="text-[9px] font-semibold tabular">{value}</span>
    </span>
  )
}
