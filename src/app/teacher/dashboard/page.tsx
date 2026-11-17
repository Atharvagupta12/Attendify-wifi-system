"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  BookOpen,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  PlayCircle,
  Radio,
  Square,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, PageHeader, Panel, Spinner, StatCard, StatusBadge, selectClass } from "@/components/common"
import { useUser } from "@/components/app-shell"
import { api, errorMessage } from "@/lib/client"
import { useResource } from "@/lib/use-resource"
import { formatDateLabel, formatTimeRange } from "@/lib/format"

type Overview = {
  today: string
  todaysClasses: {
    scheduleId: string
    subject: string
    class: string
    startTime: string
    endTime: string
    state: "upcoming" | "live" | "completed"
    present: number
    total: number
  }[]
  activeSession: { id: string; scheduleId: string; subject: string; class: string; expiresAt: string } | null
  stats: {
    weeklyClasses: number
    classes: number
    students: number
    lecturesHeld30d: number
    averageAttendance: number | null
  }
  recent: {
    scheduleId: string
    date: string
    subject: string
    class: string
    startTime: string
    endTime: string
    present: number
    total: number
    state: string
  }[]
}

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])
  if (!target) return null
  const ms = Math.max(0, new Date(target).getTime() - now)
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function TeacherDashboard() {
  const user = useUser()
  // Live view: refresh every 10 s so WiFi check-ins appear without reloading.
  const { data, reload: load } = useResource<Overview>("/api/teacher/overview", 10_000)
  const [busy, setBusy] = useState<string | null>(null)
  const [duration, setDuration] = useState(60)

  const countdown = useCountdown(data?.activeSession?.expiresAt)

  const startSession = async (scheduleId: string) => {
    setBusy(scheduleId)
    try {
      await api("/api/teacher/sessions", { method: "POST", body: { scheduleId, durationMinutes: duration } })
      toast.success(`Attendance open for ${duration} minutes`)
      await load()
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
      await load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (!data) return <Spinner label="Loading dashboard…" />

  const { stats, activeSession } = data
  const firstName = user.name.split(" ")[0]

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description={`${formatDateLabel(data.today)} · ${data.todaysClasses.length} lecture${data.todaysClasses.length === 1 ? "" : "s"} today`}
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/schedule">
              <CalendarPlus /> Manage schedule
            </Link>
          </Button>
        }
      />

      {activeSession && (
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="relative flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <Radio className="size-5" />
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            </span>
            <div>
              <p className="font-semibold">
                Attendance session live · {activeSession.subject} ({activeSession.class})
              </p>
              <p className="text-sm text-muted-foreground">
                Students connected to the classroom WiFi are being marked present. Closes in{" "}
                <span className="font-mono font-medium text-foreground">{countdown}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/teacher/attendance?scheduleId=${activeSession.scheduleId}&date=${data.today}`}>
                View roster
              </Link>
            </Button>
            <Button variant="destructive" disabled={busy === activeSession.id} onClick={() => stopSession(activeSession.id)}>
              <Square /> Stop
            </Button>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} tone="primary" label="Weekly lectures" value={stats.weeklyClasses} hint={`${stats.classes} classes`} />
        <StatCard icon={Users} label="Students" value={stats.students} hint="across your classes" />
        <StatCard icon={ClipboardCheck} label="Lectures held" value={stats.lecturesHeld30d} hint="last 30 days" />
        <StatCard
          icon={TrendingUp}
          tone={stats.averageAttendance === null ? "default" : stats.averageAttendance >= 75 ? "success" : "danger"}
          label="Avg. attendance"
          value={stats.averageAttendance === null ? "—" : `${stats.averageAttendance}%`}
          hint="last 30 days"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Today's lectures"
          action={
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Session length
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={`${selectClass} h-7 w-auto`}>
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
              description="Enjoy the break — or add a lecture to your weekly schedule."
              action={
                <Button asChild size="sm">
                  <Link href="/teacher/schedule">Add lecture</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y">
              {data.todaysClasses.map((c) => {
                const isSessionClass = activeSession?.scheduleId === c.scheduleId
                return (
                  <li key={c.scheduleId} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{c.subject}</p>
                        <StatusBadge status={c.state} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {c.class} · {formatTimeRange(c.startTime, c.endTime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.present}</span>/{c.total} present
                      </span>
                      {!isSessionClass && (
                        <Button size="sm" variant="outline" disabled={busy === c.scheduleId} onClick={() => startSession(c.scheduleId)}>
                          <PlayCircle /> Start session
                        </Button>
                      )}
                      <Button asChild size="icon-sm" variant="ghost" aria-label="Open roster">
                        <Link href={`/teacher/attendance?scheduleId=${c.scheduleId}&date=${data.today}`}>
                          <ChevronRight />
                        </Link>
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Attendance opens automatically during each scheduled slot. Start a session to open it now — for extra or
            rescheduled lectures.
          </p>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Recent lectures"
          action={
            <Link href="/teacher/attendance" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {data.recent.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No lectures yet" description="Attendance reports appear here once lectures are held." />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.recent.map((r) => (
                <li key={`${r.scheduleId}-${r.date}`}>
                  <Link
                    href={`/teacher/attendance?scheduleId=${r.scheduleId}&date=${r.date}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.subject} · {r.class}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateLabel(r.date, data.today)}</p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">
                      {r.present}/{r.total}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
