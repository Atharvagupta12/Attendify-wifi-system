import { cn } from "@/lib/utils"

const PALETTE = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
]

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** Initials avatar with a stable colour derived from the name. */
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const sizes = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-11 text-sm" }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        PALETTE[hash % PALETTE.length],
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
