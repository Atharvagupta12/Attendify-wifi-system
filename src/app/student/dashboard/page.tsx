"use client"

import { useState, type SyntheticEvent } from "react"
import toast from "react-hot-toast"
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  Pencil,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardSkeleton, EmptyState, Field, PageHeader, Panel, ProgressBar, StatusBadge } from "@/components/common"
import { useUser } from "@/components/app-shell"
import { AnimatedNumber } from "@/components/animated-number"
import { AttendanceHeatmap, AttendanceRing } from "@/components/charts"
import { RadarPulse } from "@/components/radar"
import { api, errorMessage } from "@/lib/client"
import { useResource } from "@/lib/use-resource"
import { useNow } from "@/lib/use-now"
import { formatDateLabel, formatDuration, formatTimeRange, greeting, minutesUntil, titleCaseDay } from "@/lib/format"
import { cn } from "@/lib/utils"

type Overview = {
  today: string
  nowTime: string
  student: { name: string; rollNumber: string; class: string }
  device: { macAddress: string; deviceName: string | null } | null
  stats: { periodDays: number; totalClasses: number; present: number; absent: number; attendancePercentage: number | null }
  subjectStats: { subject: string; present: number; total: number; percentage: number }[]
  liveClass: {
    subject: string
    teacher: string
    startTime: string
    endTime: string
    status: "Present" | "Absent" | "Pending"
  } | null
  upcoming: { date: string; day: string; subject: string; teacher: string; startTime: string; endTime: string }[]
  history: { scheduleId: string; date: string; subject: string; teacher: string; startTime: string; endTime: string; status: string }[]
}

const REQUIRED = 75

export default function StudentDashboard() {
  const user = useUser()
  // Refresh every 15 s so a WiFi check-in shows up while the student is in class.
  const { data, reload } = useResource<Overview>("/api/student/overview", 15_000)
  const now = useNow(60_000)

  if (!data) return <DashboardSkeleton stats={3} />

  const { stats, liveClass, today } = data
  const pct = stats.attendancePercentage
  const counted = data.history.filter((h) => h.status !== "Pending")
  const streak = counted.findIndex((h) => h.status !== "Present")
  const currentStreak = streak === -1 ? counted.length : streak
  const needed = pct !== null && pct < REQUIRED ? Math.ceil((REQUIRED * stats.totalClasses - 100 * stats.present) / (100 - REQUIRED)) : 0
  // Lectures that can be missed while staying at or above the threshold
  const buffer = pct !== null && pct >= REQUIRED ? Math.floor((100 * stats.present) / REQUIRED - stats.totalClasses) : 0

  const status =
    pct === null
      ? { tone: "primary", icon: Sparkles, title: "You're all set", text: "Your attendance appears here after your first lecture." }
      : pct >= REQUIRED
        ? {
            tone: "success",
            icon: ShieldCheck,
            title: "You're on track",
            text: buffer > 0 ? `You can miss ${buffer} lecture${buffer === 1 ? "" : "s"} and still stay above ${REQUIRED}%.` : `Right at the line. Don't miss the next lecture.`,
          }
        : {
            tone: "danger",
            icon: AlertTriangle,
            title: "Attendance at risk",
            text: `Attend the next ${needed} lecture${needed === 1 ? "" : "s"} in a row to get back to ${REQUIRED}%.`,
          }

  const [next, ...later] = data.upcoming

  return (
    <>
      <PageHeader
        eyebrow={`Class ${data.student.class} · Roll ${data.student.rollNumber}`}
        title={`${greeting(new Date(now).getHours())}, ${user.name.split(" ")[0]}`}
        description={formatDateLabel(today)}
      />

      {/* ---------- Live lecture ---------- */}
      {liveClass && (
        <div
          className={cn(
            "relative mb-8 flex animate-rise flex-col items-center gap-5 overflow-hidden rounded-2xl border bg-card p-6 shadow-soft sm:flex-row",
            liveClass.status === "Present" ? "border-success/30" : "border-warning/40",
          )}
        >
          <div
            className={cn(
              "absolute inset-0",
              liveClass.status === "Present"
                ? "bg-[radial-gradient(60%_120%_at_0%_50%,color-mix(in_oklch,var(--success)_12%,transparent),transparent)]"
                : "bg-[radial-gradient(60%_120%_at_0%_50%,color-mix(in_oklch,var(--warning)_14%,transparent),transparent)]",
            )}
          />
          {liveClass.status === "Present" ? (
            <span className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-success/15 text-success ring-8 ring-success/5">
              <CheckCircle2 className="size-10" />
            </span>
          ) : (
            <RadarPulse size={96} className="relative" />
          )}
          <div className="relative text-center sm:text-left">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Happening now</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">
              {liveClass.status === "Present" ? "You're checked in" : "Waiting for your phone…"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {liveClass.subject} with {liveClass.teacher} · {formatTimeRange(liveClass.startTime, liveClass.endTime)}
            </p>
            {liveClass.status !== "Present" && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-warning">
                <Wifi className="size-4" /> Connect your registered phone to the classroom WiFi
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------- Overview ---------- */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="relative flex items-center overflow-hidden rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]" />
          <div className="relative flex w-full flex-col items-center gap-8 sm:flex-row">
            <AttendanceRing value={pct}>
              <span className="text-4xl font-semibold tracking-tight">
                {pct === null ? "–" : <AnimatedNumber value={pct} suffix="%" />}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">attendance</span>
            </AttendanceRing>

            <div className="w-full min-w-0 flex-1">
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl p-3.5",
                  status.tone === "success" ? "bg-success/8" : status.tone === "danger" ? "bg-danger/8" : "bg-primary/8",
                )}
              >
                <status.icon
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    status.tone === "success" ? "text-success" : status.tone === "danger" ? "text-danger" : "text-primary",
                  )}
                />
                <div>
                  <p className="font-semibold">{status.title}</p>
                  <p className="text-sm text-muted-foreground">{status.text}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Held", value: stats.totalClasses, icon: BookOpen, cls: "text-primary" },
                  { label: "Present", value: stats.present, icon: CheckCircle2, cls: "text-success" },
                  { label: "Absent", value: stats.absent, icon: XCircle, cls: "text-danger" },
                  { label: "Streak", value: currentStreak, icon: Flame, cls: "text-warning" },
                ].map(({ label, value, icon: Icon, cls }) => (
                  <div key={label} className="rounded-xl border bg-background/50 p-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className={cn("size-3.5", cls)} /> {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      <AnimatedNumber value={value} />
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Last {stats.periodDays} days · the marker on the ring shows the {REQUIRED}% requirement</p>
            </div>
          </div>
        </section>

        {/* Next lecture */}
        <Panel title="Coming up" bodyClassName="pt-4">
          {!next ? (
            <EmptyState icon={CalendarClock} title="Nothing scheduled this week" />
          ) : (
            <>
              <div className="relative overflow-hidden rounded-xl bg-brand-gradient p-4 text-white shadow-[0_10px_30px_-12px] shadow-primary/60">
                <div className="absolute -right-8 -bottom-10 opacity-30">
                  <RadarPulse size={120} showCore={false} />
                </div>
                <p className="relative text-xs font-medium text-white/80">
                  {next.date === today
                    ? `Today · in ${formatDuration(Math.max(1, minutesUntil(next.startTime, data.nowTime)))}`
                    : titleCaseDay(next.day)}
                </p>
                <p className="relative mt-1 text-lg font-semibold">{next.subject}</p>
                <p className="relative text-sm text-white/80">
                  {formatTimeRange(next.startTime, next.endTime)} · {next.teacher}
                </p>
              </div>
              {later.length > 0 && (
                <ul className="mt-3 flex flex-col">
                  {later.map((u, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.teacher}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm">{u.date === today ? "Today" : titleCaseDay(u.day).slice(0, 3)}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeRange(u.startTime, u.endTime)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
      </div>

      {/* ---------- Heatmap + subjects ---------- */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Attendance calendar" description="Each square is a day; hover for details" className="lg:col-span-2">
          <AttendanceHeatmap records={data.history} today={today} weeks={5} />
        </Panel>

        <Panel title="By subject" description={`Marker shows the ${REQUIRED}% requirement`}>
          {data.subjectStats.length === 0 ? (
            <EmptyState icon={BookOpen} title="No lectures yet" />
          ) : (
            <ul className="flex flex-col gap-5">
              {data.subjectStats.map((s) => (
                <li key={s.subject}>
                  <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{s.subject}</span>
                    <span className="shrink-0 tabular text-muted-foreground">
                      {s.present}/{s.total}
                      <span
                        className={cn(
                          "ml-2 font-semibold",
                          s.percentage >= REQUIRED ? "text-success" : s.percentage >= 50 ? "text-warning" : "text-danger",
                        )}
                      >
                        {s.percentage}%
                      </span>
                    </span>
                  </div>
                  <ProgressBar value={s.percentage} marker={REQUIRED} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ---------- History + device ---------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Recent lectures" className="lg:col-span-2">
          {data.history.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No attendance records yet" />
          ) : (
            <ul className="-mx-2 flex flex-col">
              {data.history.slice(0, 10).map((h) => (
                <li
                  key={`${h.scheduleId}-${h.date}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      h.status === "Present" ? "bg-success/12 text-success" : h.status === "Absent" ? "bg-danger/12 text-danger" : "bg-warning/15 text-warning",
                    )}
                  >
                    {h.status === "Present" ? <CheckCircle2 className="size-4" /> : h.status === "Absent" ? <XCircle className="size-4" /> : <Wifi className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateLabel(h.date, today)} · {formatTimeRange(h.startTime, h.endTime)} · {h.teacher}
                    </p>
                  </div>
                  <StatusBadge status={h.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <DeviceCard key={data.device?.macAddress ?? "none"} device={data.device} onSaved={reload} />
      </div>
    </>
  )
}

function DeviceCard({ device, onSaved }: { device: Overview["device"]; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [mac, setMac] = useState(device?.macAddress ?? "")
  const [name, setName] = useState(device?.deviceName ?? "")
  const [saving, setSaving] = useState(false)

  const save = async (e: SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api("/api/student/device", { method: "PUT", body: { macAddress: mac, deviceName: name || undefined } })
      toast.success("Device updated")
      setEditing(false)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title="Your device"
      action={
        !editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil /> Change
          </Button>
        )
      }
    >
      {editing ? (
        <form onSubmit={save} className="flex flex-col gap-3">
          <Field label="WiFi MAC address">
            <Input required value={mac} onChange={(e) => setMac(e.target.value)} className="font-mono" placeholder="AA:BB:CC:DD:EE:FF" />
          </Field>
          <Field label="Device name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pixel 8" />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              Save device
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : device ? (
        <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-muted/60 to-transparent p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{device.deviceName || "My phone"}</p>
              <p className="font-mono text-xs text-muted-foreground">{device.macAddress}</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
            <ShieldCheck className="size-3.5" /> Registered for WiFi attendance
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No device registered. You can&apos;t be marked present until you add one.</p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Use the private MAC address your phone shows for the classroom network. Update it here if you switch phones.
      </p>
    </Panel>
  )
}
