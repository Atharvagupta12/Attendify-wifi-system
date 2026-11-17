"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft, ClipboardCheck, Download, Mail, Search, Wifi, UserPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, PageHeader, Panel, ProgressBar, Spinner, StatusBadge, selectClass } from "@/components/common"
import { api, downloadCsv, errorMessage } from "@/lib/client"
import { useResource } from "@/lib/use-resource"
import { formatDateLabel, formatTime12, formatTimeRange, percentage } from "@/lib/format"
import { toCsv } from "@/lib/csv"

type Lecture = {
  scheduleId: string
  date: string
  state: string
  subject: string
  class: string
  startTime: string
  endTime: string
  present: number
  total: number
}

type Roster = {
  schedule: { id: string; subject: string; class: string; startTime: string; endTime: string }
  date: string
  state: "upcoming" | "live" | "completed"
  summary: { present: number; absent: number; total: number }
  students: {
    studentId: string
    name: string
    rollNumber: string
    status: "Present" | "Absent" | "Pending"
    source: "WIFI" | "MANUAL" | null
    markedAt: string | null
  }[]
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AttendanceContent />
    </Suspense>
  )
}

function AttendanceContent() {
  const params = useSearchParams()
  const scheduleId = params.get("scheduleId")
  const date = params.get("date")
  return scheduleId && date ? <RosterView scheduleId={scheduleId} date={date} /> : <LectureHistory />
}

function LectureHistory() {
  const [days, setDays] = useState(30)
  const [classFilter, setClassFilter] = useState("all")
  const lectures = useResource<{ data: Lecture[] }>(`/api/teacher/attendance?days=${days}`).data?.data ?? null

  const classes = useMemo(() => [...new Set(lectures?.map((l) => `${l.subject} · ${l.class}`))].sort(), [lectures])
  const visible = lectures?.filter((l) => classFilter === "all" || `${l.subject} · ${l.class}` === classFilter) ?? []

  const exportAll = () => {
    downloadCsv(
      `attendance-summary-${days}d.csv`,
      toCsv([
        ["Date", "Subject", "Class", "Time", "Present", "Total", "Attendance %"],
        ...visible.map((l) => [
          l.date,
          l.subject,
          l.class,
          formatTimeRange(l.startTime, l.endTime),
          l.present,
          l.total,
          percentage(l.present, l.total) ?? "",
        ]),
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Every lecture you've held, with live WiFi check-ins. Open one to see the full roster."
        actions={
          <Button variant="outline" onClick={exportAll} disabled={visible.length === 0}>
            <Download /> Export summary
          </Button>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`${selectClass} sm:w-64`}>
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={`${selectClass} sm:w-40`}>
            {[7, 30, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </div>

        {lectures === null ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No lectures in this period" description="Lectures appear here once their time slot starts." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lecture</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
                <TableHead className="w-48">Attendance</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((l) => {
                const pct = percentage(l.present, l.total)
                return (
                  <TableRow key={`${l.scheduleId}-${l.date}`}>
                    <TableCell className="whitespace-nowrap">{formatDateLabel(l.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{l.subject}</span>
                        {l.state === "live" && <StatusBadge status="live" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{l.class}</span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {formatTimeRange(l.startTime, l.endTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={pct} />
                        <span className="w-14 shrink-0 text-right text-sm tabular-nums">
                          {l.present}/{l.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/teacher/attendance?scheduleId=${l.scheduleId}&date=${l.date}`}>Roster</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}

function RosterView({ scheduleId, date }: { scheduleId: string; date: string }) {
  const [live, setLive] = useState(false)
  // Auto-refresh every 5 s while the lecture is live so WiFi check-ins appear in real time.
  const { data: roster, reload: load } = useResource<Roster>(
    `/api/teacher/attendance/roster?scheduleId=${scheduleId}&date=${date}`,
    live ? 5000 : undefined,
  )
  const isLive = roster?.state === "live"
  if (roster && isLive !== live) setLive(isLive) // adjust polling during render, per React docs

  const [query, setQuery] = useState("")
  const [emailing, setEmailing] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const setStatus = async (studentId: string, status: "Present" | "Absent") => {
    setUpdating(studentId)
    try {
      await api("/api/teacher/attendance/roster", { method: "PATCH", body: { scheduleId, studentId, date, status } })
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUpdating(null)
    }
  }

  const email = async () => {
    setEmailing(true)
    try {
      const res = await api<{ message: string }>("/api/teacher/attendance/email", {
        method: "POST",
        body: { scheduleId, date },
      })
      toast.success(res.message)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setEmailing(false)
    }
  }

  if (!roster) return <Spinner />

  const { schedule, summary } = roster
  const q = query.trim().toLowerCase()
  const students = roster.students.filter((s) => !q || s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q))

  const exportCsv = () =>
    downloadCsv(
      `attendance-${schedule.subject}-${schedule.class}-${date}.csv`.replace(/\s+/g, "_"),
      toCsv([
        ["Roll", "Name", "Status", "Marked by", "Marked at"],
        ...roster.students.map((s) => [
          s.rollNumber,
          s.name,
          s.status,
          s.source === "WIFI" ? "WiFi" : s.source === "MANUAL" ? "Teacher" : "",
          s.markedAt ? new Date(s.markedAt).toLocaleTimeString() : "",
        ]),
      ]),
    )

  return (
    <>
      <Link href="/teacher/attendance" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All lectures
      </Link>

      <PageHeader
        title={`${schedule.subject} · ${schedule.class}`}
        description={
          <span className="flex items-center gap-2">
            {formatDateLabel(date)} · {formatTimeRange(schedule.startTime, schedule.endTime)} <StatusBadge status={roster.state} />
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download /> CSV
            </Button>
            <Button variant="outline" onClick={email} disabled={emailing}>
              <Mail /> {emailing ? "Sending…" : "Email report"}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["Present", summary.present, "text-emerald-600"],
          [roster.state === "completed" ? "Absent" : "Not yet", summary.absent, "text-red-600"],
          ["Attendance", `${percentage(summary.present, summary.total) ?? 0}%`, "text-primary"],
        ].map(([label, value, color]) => (
          <div key={label as string} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <Panel>
        <div className="relative mb-4 sm:w-72">
          <Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or roll no." className="pl-8" />
        </div>

        {roster.students.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No students in this class yet" description="Students appear here after they sign up and pick this class." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Roll</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Marked</TableHead>
                <TableHead className="text-right">Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell className="tabular-nums">{s.rollNumber}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {s.source && (
                      <span className="flex items-center gap-1.5 text-xs">
                        {s.source === "WIFI" ? <Wifi className="size-3.5" /> : <UserPen className="size-3.5" />}
                        {s.source === "WIFI" ? "WiFi" : "Teacher"}
                        {s.markedAt && ` · ${formatTime12(new Date(s.markedAt).toTimeString().slice(0, 5))}`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex rounded-lg border p-0.5">
                      {(["Present", "Absent"] as const).map((st) => (
                        <button
                          key={st}
                          disabled={updating === s.studentId || s.status === st}
                          onClick={() => setStatus(s.studentId, st)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            s.status === st
                              ? st === "Present"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : "bg-red-500/15 text-red-700"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}
