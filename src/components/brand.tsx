import { cn } from "@/lib/utils"

export const GITHUB_URL = "https://github.com/Atharvagupta12/Attendify-wifi-system"

/** Brand mark: signal arcs over a dot, on the brand gradient. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-gradient text-white shadow-[0_4px_14px_-4px] shadow-primary/60",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-[58%]">
        <path d="M4.5 10.5a11 11 0 0 1 15 0" opacity="0.55" />
        <path d="M7.8 13.6a6.5 6.5 0 0 1 8.4 0" opacity="0.8" />
        <circle cx="12" cy="17.2" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-[15px] font-semibold tracking-tight", className)}>
      <LogoMark />
      {!compact && <span>Attendify</span>}
    </span>
  )
}

export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
