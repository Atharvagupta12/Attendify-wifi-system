"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark" | "system"
const KEY = "attendify-theme"

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong theme.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`

const listeners = new Set<() => void>()

function readTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme) || "system"
  } catch {
    return "system"
  }
}

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  const root = document.documentElement
  // Disable transitions for the instant of the switch so every surface changes together.
  root.classList.add("[&_*]:!transition-none")
  root.classList.toggle("dark", dark)
  requestAnimationFrame(() => root.classList.remove("[&_*]:!transition-none"))
}

function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {}
  apply(theme)
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const media = matchMedia("(prefers-color-scheme: dark)")
  const onSystem = () => readTheme() === "system" && apply("system")
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      apply(readTheme())
      cb()
    }
  }
  media.addEventListener("change", onSystem)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    media.removeEventListener("change", onSystem)
    window.removeEventListener("storage", onStorage)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme)
  return { theme, setTheme }
}

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const

/** Three-way segmented control (sidebar). */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-lg border bg-muted/50 p-0.5", className)}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md px-2.5 py-1 transition-colors",
            theme === value ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

/** Compact icon button that flips light/dark (navbars). */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme()
  const flip = () => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
  return (
    <button
      onClick={flip}
      aria-label="Toggle dark mode"
      className={cn(
        "relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
    </button>
  )
}
