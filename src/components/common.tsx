import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
        {description && <div className="mt-1.5 text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border bg-card shadow-soft", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h2 className="font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

const TONES = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
  warning: "bg-warning/15 text-warning",
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ComponentType<{ className?: string }>
  tone?: keyof typeof TONES
  className?: string
}) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  Present: "bg-success/12 text-success",
  Absent: "bg-danger/12 text-danger",
  Pending: "bg-warning/15 text-warning",
  live: "bg-success/12 text-success",
  upcoming: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
}

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  upcoming: "Upcoming",
  completed: "Done",
  Pending: "Waiting",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {(status === "live" || status === "Pending") && (
        <span className={cn("size-1.5 animate-blink rounded-full", status === "live" ? "bg-success" : "bg-warning")} />
      )}
      {status === "Present" && <span className="size-1.5 rounded-full bg-success" />}
      {status === "Absent" && <span className="size-1.5 rounded-full bg-danger" />}
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-soft ring-1 ring-border">
        <Icon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------------- Skeletons ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />
}

export function DashboardSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className={cn("mb-6 grid gap-4 sm:grid-cols-2", stats === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {Array.from({ length: stats }, (_, i) => (
          <Skeleton key={i} className="h-[124px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Kept for small inline loading states. */
export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" /> {label}
    </div>
  )
}

export function ProgressBar({ value, marker, className }: { value: number | null; marker?: number; className?: string }) {
  const v = value ?? 0
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          v >= 75 ? "bg-success" : v >= 50 ? "bg-warning" : "bg-danger",
        )}
        style={{ width: `${v}%` }}
      />
      {marker !== undefined && (
        <span className="absolute inset-y-0 w-0.5 bg-foreground/40" style={{ left: `${marker}%` }} title={`${marker}% required`} />
      )}
    </div>
  )
}

export const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
