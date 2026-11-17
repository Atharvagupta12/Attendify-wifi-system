import { Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Signature visual: a WiFi radar pulse with "devices" appearing around it.
 * `dots` = number of connected devices to show (capped for legibility).
 */
export function RadarPulse({
  size = 160,
  dots = 0,
  tone = "primary",
  className,
  showCore = true,
}: {
  size?: number
  dots?: number
  tone?: "primary" | "success"
  className?: string
  showCore?: boolean
}) {
  const color = tone === "success" ? "var(--success)" : "var(--primary)"
  const shown = Math.min(dots, 14)

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      {/* static guide rings */}
      {[1, 0.7, 0.4].map((s) => (
        <span
          key={s}
          className="absolute inset-0 m-auto rounded-full border"
          style={{
            width: `${s * 100}%`,
            height: `${s * 100}%`,
            borderColor: `color-mix(in oklch, ${color} 18%, transparent)`,
          }}
        />
      ))}
      {/* expanding pulses */}
      {[0, 0.93, 1.86].map((delay) => (
        <span
          key={delay}
          className="absolute inset-0 animate-radar rounded-full"
          style={{
            animationDelay: `${delay}s`,
            background: `radial-gradient(circle, transparent 55%, color-mix(in oklch, ${color} 35%, transparent) 70%, transparent 71%)`,
          }}
        />
      ))}
      {/* devices: deterministic golden-angle placement */}
      {Array.from({ length: shown }, (_, i) => {
        const angle = i * 137.5 * (Math.PI / 180)
        const r = 0.24 + ((i * 0.618) % 1) * 0.22
        return (
          <span
            key={i}
            className="absolute size-2 animate-rise rounded-full ring-2 ring-background"
            style={{
              left: `calc(${50 + Math.cos(angle) * r * 100}% - 4px)`,
              top: `calc(${50 + Math.sin(angle) * r * 100}% - 4px)`,
              background: color,
              animationDelay: `${i * 70}ms`,
            }}
          />
        )
      })}
      {showCore && (
        <span
          className="absolute inset-0 m-auto flex items-center justify-center rounded-full text-white"
          style={{
            width: size * 0.26,
            height: size * 0.26,
            background: `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 60%, var(--brand-2)))`,
            boxShadow: `0 0 0 6px color-mix(in oklch, ${color} 15%, transparent), 0 8px 24px -6px ${color}`,
          }}
        >
          <Wifi style={{ width: size * 0.12, height: size * 0.12 }} />
        </span>
      )}
    </div>
  )
}

/** Small blinking "live" dot. */
export function LiveDot({ className, tone = "success" }: { className?: string; tone?: "success" | "primary" }) {
  return (
    <span className={cn("relative inline-flex size-2", className)}>
      <span
        className={cn(
          "absolute inset-0 animate-ping rounded-full opacity-60",
          tone === "success" ? "bg-success" : "bg-primary",
        )}
      />
      <span className={cn("relative inline-flex size-2 rounded-full", tone === "success" ? "bg-success" : "bg-primary")} />
    </span>
  )
}
