"use client"

import { useState, type SyntheticEvent } from "react"
import toast from "react-hot-toast"
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Percent,
  Smartphone,
  Wifi,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState, Field, PageHeader, Panel, ProgressBar, Spinner, StatCard, StatusBadge } from "@/components/common"
import { useUser } from "@/components/app-shell"
import { api, errorMessage } from "@/lib/client"
import { useResource } from "@/lib/use-resource"
import { formatDateLabel, formatTimeRange, titleCaseDay } from "@/lib/format"

type Overview = {
  today: string
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
  const { data, reload: load } = useResource<Overview>("/api/student/overview", 15_000)

  if (!data) return <Spinner label="Loading your attendance…" />

  const { stats, liveClass } = data
  const pct = stats.attendancePercentage
  const today = data.today

  return (
    <>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        description={`Class ${data.student.class} · Roll no. ${data.student.rollNumber}`}
      />

      {liveClass && (
        <div
          className={`mb-6 flex items-center gap-4 rounded-xl border p-5 ${
            liveClass.status === "Present" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          {liveClass.status === "Present" ? (
            <CheckCircle2 className="size-8 shrink-0 text-emerald-600" />
          ) : (
            <Wifi className="size-8 shrink-0 animate-pulse text-amber-600" />
          )}
          <div>
            <p className="font-semibold">
              {liveClass.subject} is in progress · {formatTimeRange(liveClass.startTime, liveClass.endTime)}
            </p>
            <p className="text-sm text-muted-foreground">
              {liveClass.status === "Present"
                ? "You're checked in. Your phone was detected on the classroom WiFi."
                : "Connect your registered phone to the classroom WiFi to be marked present."}
            </p>
          </div>
        </div>
      )}

      {pct !== null && pct < REQUIRED && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-red-600" />
          Your attendance is below the required {REQUIRED}%. Attend the next{" "}
          {Math.max(1, Math.ceil((REQUIRED * stats.totalClasses - 100 * stats.present) / (100 - REQUIRED)))} lectures in a row to get back on track.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Percent}
          tone={pct === null ? "default" : pct >= REQUIRED ? "success" : "danger"}
          label="Attendance"
          value={pct === null ? "—" : `${pct}%`}
          hint={`last ${stats.periodDays} days`}
        />
        <StatCard icon={BookOpen} tone="primary" label="Lectures held" value={stats.totalClasses} />
        <StatCard icon={CheckCircle2} tone="success" label="Present" value={stats.present} />
        <StatCard icon={XCircle} tone="danger" label="Absent" value={stats.absent} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="By subject">
          {data.subjectStats.length === 0 ? (
            <EmptyState icon={BookOpen} title="No lectures yet" description="Your subject-wise attendance appears after your first lecture." />
          ) : (
            <ul className="flex flex-col gap-4">
              {data.subjectStats.map((s) => (
                <li key={s.subject}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{s.subject}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.present}/{s.total} · <span className="font-medium text-foreground">{s.percentage}%</span>
                    </span>
                  </div>
                  <ProgressBar value={s.percentage} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Coming up">
          {data.upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing scheduled this week" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.upcoming.map((u, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.teacher}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-medium">{u.date === today ? "Today" : titleCaseDay(u.day)}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeRange(u.startTime, u.endTime)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Recent attendance" className="lg:col-span-2">
          {data.history.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No attendance records yet" />
          ) : (
            <ul className="divide-y">
              {data.history.slice(0, 12).map((h) => (
                <li key={`${h.scheduleId}-${h.date}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{h.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLabel(h.date, today)} ·{formatTimeRange(h.startTime, h.endTime)}
                    </p>
                  </div>
                  <StatusBadge status={h.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <DeviceCard device={data.device} onSaved={load} />
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
      title="Registered device"
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
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : device ? (
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </div>
          <div>
            <p className="font-medium">{device.deviceName || "My phone"}</p>
            <p className="font-mono text-xs text-muted-foreground">{device.macAddress}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No device registered — you can&apos;t be marked present until you add one.</p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Use the private MAC your phone shows for the classroom network. Update it here if you switch phones.
      </p>
    </Panel>
  )
}
