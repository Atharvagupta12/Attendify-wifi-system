import type { ComponentType, ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-xs", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ComponentType<{ className?: string }>
  tone?: "default" | "success" | "danger" | "primary"
}) {
  const tones = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    danger: "bg-red-500/10 text-red-600",
  }
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-xs">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  Present: "bg-emerald-500/10 text-emerald-700",
  Absent: "bg-red-500/10 text-red-700",
  Pending: "bg-amber-500/10 text-amber-700",
  live: "bg-emerald-500/10 text-emerald-700",
  upcoming: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
}

const STATUS_LABEL: Record<string, string> = {
  live: "Live now",
  upcoming: "Upcoming",
  completed: "Done",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status === "live" && <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />}
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
      <Icon className="mb-3 size-8 text-muted-foreground/60" />
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  )
}

export function ProgressBar({ value }: { value: number | null }) {
  const v = value ?? 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", v >= 75 ? "bg-emerald-500" : v >= 50 ? "bg-amber-500" : "bg-red-500")}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}
