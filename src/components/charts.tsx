"use client"

import { useId } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import { formatDateLabel, formatShortDate } from "@/lib/format"

/* ------------------------------------------------------------------ */
/* Attendance ring                                                      */
/* ------------------------------------------------------------------ */

export function AttendanceRing({
  value,
  size = 168,
  stroke = 14,
  threshold = 75,
  children,
}: {
  value: number | null
  size?: number
  stroke?: number
  threshold?: number
  children?: React.ReactNode
}) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = value ?? 0
  const offset = c * (1 - v / 100)
  const tone = value === null ? "var(--muted-foreground)" : v >= threshold ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)"
  // Marker for the required threshold, measured clockwise from 12 o'clock.
  const ta = (threshold / 100) * 2 * Math.PI
  const tx = size / 2 + Math.sin(ta) * r
  const ty = size / 2 - Math.cos(ta) * r

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tone} />
            <stop offset="100%" stopColor={`color-mix(in oklch, ${tone} 65%, var(--brand-2))`} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
          style={{ animation: "ring-in 1.2s cubic-bezier(.2,.7,.3,1) both", ["--ring-c" as string]: `${c}` }}
        />
      </svg>
      {/* threshold tick, drawn unrotated */}
      <svg width={size} height={size} className="pointer-events-none absolute inset-0" aria-hidden>
        <circle cx={tx} cy={ty} r={3} fill="var(--card)" stroke="var(--foreground)" strokeOpacity={0.35} strokeWidth={1.5} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
      <style>{`@keyframes ring-in { from { stroke-dashoffset: var(--ring-c); } }`}</style>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Trend chart                                                          */
/* ------------------------------------------------------------------ */

export function TrendChart({
  data,
  height = 220,
}: {
  data: { date: string; percentage: number; present: number; total: number }[]
  height?: number
}) {
  const id = useId().replace(/:/g, "")
  return (
    <div style={{ height }} className="-ml-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(d: string) => formatShortDate(d)}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined
              if (!active || !p) return null
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-float">
                  <p className="font-medium">{formatDateLabel(p.date)}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{p.percentage}%</span> · {p.present}/{p.total} present
                  </p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="var(--chart-1)"
            strokeWidth={2.25}
            fill={`url(#fill-${id})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: "var(--chart-1)" }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Attendance heatmap (GitHub-style, one cell per day)                  */
/* ------------------------------------------------------------------ */

type DayRecord = { date: string; status: string }

function addDays(key: string, n: number) {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function AttendanceHeatmap({ records, today, weeks = 6 }: { records: DayRecord[]; today: string; weeks?: number }) {
  const byDay = new Map<string, { present: number; held: number }>()
  for (const r of records) {
    if (r.status === "Pending") continue
    const e = byDay.get(r.date) ?? { present: 0, held: 0 }
    e.held++
    if (r.status === "Present") e.present++
    byDay.set(r.date, e)
  }

  // Calendar layout: one row per Monday-starting week, ending with the current week.
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const start = addDays(today, -weekday - (weeks - 1) * 7)
  const rows = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))

  const cell = (key: string) => {
    if (key > today) return "border border-dashed border-border bg-transparent text-muted-foreground/50"
    const e = byDay.get(key)
    if (!e) return "bg-muted/70 text-muted-foreground"
    const ratio = e.present / e.held
    if (ratio === 1) return "bg-success text-white"
    if (ratio >= 0.5) return "bg-success/45 text-foreground"
    if (ratio > 0) return "bg-warning/70 text-foreground"
    return "bg-danger/75 text-white"
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {rows.flat().map((key) => {
          const e = byDay.get(key)
          const day = Number(key.slice(8))
          return (
            <span
              key={key}
              title={`${formatDateLabel(key)}${e ? ` · ${e.present}/${e.held} lectures attended` : key > today ? "" : " · no lectures"}`}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-lg text-xs font-medium tabular transition-transform hover:scale-[1.08] sm:h-10",
                cell(key),
                key === today && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              {day === 1 ? formatShortDate(key) : day}
              {e && e.held > 1 && (
                <span className="absolute right-1 bottom-0.5 text-[9px] opacity-80">{e.present}/{e.held}</span>
              )}
            </span>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {[
          ["bg-success", "All attended"],
          ["bg-success/50", "Most"],
          ["bg-warning/70", "Some"],
          ["bg-danger/70", "Missed"],
          ["bg-muted", "No lectures"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-[3px]", c)} /> {l}
          </span>
        ))}
      </div>
    </div>
  )
}
