"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ClipboardCheck, LayoutDashboard, CalendarDays, Wifi } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { RadarPulse, LiveDot } from "@/components/radar"
import { LogoMark } from "@/components/brand"
import { cn } from "@/lib/utils"

const NAMES = [
  "Aarav Mehta", "Diya Patel", "Kabir Singh", "Ananya Iyer", "Vihaan Rao", "Ishita Gupta", "Arjun Nair",
  "Meera Joshi", "Rohan Das", "Saanvi Kapoor", "Aditya Verma", "Kavya Reddy", "Neel Shah", "Tara Menon",
]
const TOTAL = 32

/** Animated miniature of the teacher dashboard: students "check in" as the radar finds them. */
export function DashboardPreview({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [count, setCount] = useState(5)

  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c >= 26 ? 5 : c + 1)), 1600)
    return () => clearInterval(id)
  }, [])

  const feed = Array.from({ length: 4 }, (_, i) => {
    const n = count - i
    return { name: NAMES[n % NAMES.length], key: n, ago: i === 0 ? "just now" : `${i * 2}s ago` }
  })
  const pct = Math.round((count / TOTAL) * 100)

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-float", className)} aria-hidden>
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="mx-auto rounded-md bg-background/80 px-3 py-0.5 text-[11px] text-muted-foreground">
          attendify.app/teacher/dashboard
        </span>
      </div>

      <div className="flex">
        {!compact && (
          <div className="hidden w-40 shrink-0 flex-col gap-1 border-r p-3 text-[11px] sm:flex">
            <div className="mb-3 flex items-center gap-2 px-1 font-semibold">
              <LogoMark className="size-6 rounded-md" /> Attendify
            </div>
            {[
              [LayoutDashboard, "Dashboard", true],
              [CalendarDays, "Schedule", false],
              [ClipboardCheck, "Attendance", false],
            ].map(([Icon, label, active]) => {
              const I = Icon as typeof LayoutDashboard
              return (
                <span
                  key={label as string}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5",
                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground",
                  )}
                >
                  <I className="size-3.5" /> {label as string}
                </span>
              )
            })}
          </div>
        )}

        <div className="min-w-0 flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Tuesday · 10:12 AM</p>
              <p className="text-sm font-semibold">Mathematics · Class 10-A</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <LiveDot /> Live
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center rounded-xl border bg-muted/30 p-2">
              <RadarPulse size={compact ? 110 : 128} dots={Math.min(count, 14)} tone="success" />
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2.5">
                  <p className="text-[10px] text-muted-foreground">Checked in</p>
                  <p className="text-lg font-semibold tabular">
                    {count}
                    <span className="text-xs font-normal text-muted-foreground">/{TOTAL}</span>
                  </p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                  <p className="text-lg font-semibold tabular text-success">{pct}%</p>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <ul className="flex flex-col gap-1">
                {feed.map((f, i) => (
                  <li
                    key={f.key}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px]",
                      i === 0 && "animate-rise bg-success/5",
                    )}
                    style={{ opacity: 1 - i * 0.18 }}
                  >
                    <Avatar name={f.name} size="sm" className="size-5 text-[8px]" />
                    <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                    <Wifi className="size-3 text-muted-foreground" />
                    <span className="w-12 text-right text-muted-foreground">{f.ago}</span>
                    <CheckCircle2 className="size-3.5 text-success" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
