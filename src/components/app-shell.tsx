"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeftRight, CalendarDays, ClipboardCheck, LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CurrentUser } from "@/lib/user"
import { Logo } from "@/components/brand"
import { Avatar } from "@/components/avatar"
import { ThemeSwitcher, ThemeToggle } from "@/components/theme"

const UserContext = createContext<CurrentUser | null>(null)

/** The logged-in user, provided by the server layout (never read from localStorage). */
export function useUser(): CurrentUser {
  const user = useContext(UserContext)
  if (!user) throw new Error("useUser must be used inside <AppShell>")
  return user
}

const NAV = {
  teacher: [
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  ],
  student: [{ href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard }],
}

export default function AppShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const logout = async (to = "/login") => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace(to)
    router.refresh()
  }

  const nav = NAV[user.role]
  const current = nav.find((n) => pathname.startsWith(n.href))

  const sidebar = (
    <div className="flex h-full flex-col p-4">
      <Link href="/" className="mb-8 rounded-lg px-2 pt-1.5">
        <Logo />
      </Link>

      <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
        {user.role === "teacher" ? "Teaching" : "Student"}
      </p>
      <nav className="flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-card text-foreground shadow-soft ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {active && <span className="absolute top-2 bottom-2 -left-4 w-1 rounded-r-full bg-brand-gradient" />}
              <Icon className={cn("size-4 transition-colors", active ? "text-primary" : "group-hover:text-foreground")} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <ThemeSwitcher className="w-full" />
        <div className="rounded-xl border bg-card p-3 shadow-soft">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.role === "teacher" ? `Teacher · ${user.identifier}` : `${user.className} · Roll ${user.identifier}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-danger/30 hover:bg-danger/5 hover:text-danger"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <UserContext.Provider value={user}>
      <div className="relative min-h-screen bg-background">
        {/* ambient brand glow behind content */}
        <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_70%_0%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]" />

        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-sidebar/80 backdrop-blur-xl md:block">{sidebar}</aside>

        {/* Mobile top bar + drawer */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-muted">
              <Menu className="size-5" />
            </button>
          </div>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 animate-in bg-black/50 backdrop-blur-sm fade-in" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 animate-in border-r bg-sidebar shadow-float slide-in-from-left">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute top-4 right-3 rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="relative min-w-0 overflow-x-clip md:pl-64">
          {/* Desktop breadcrumb bar */}
          <div className="sticky top-0 z-10 hidden h-14 items-center justify-between border-b bg-background/70 px-8 backdrop-blur-xl md:flex">
            <p className="text-sm text-muted-foreground">
              {user.role === "teacher" ? "Teacher" : "Student"}
              <span className="mx-2 text-border">/</span>
              <span className="font-medium text-foreground">{current?.label ?? "Dashboard"}</span>
            </p>
            <ThemeToggle />
          </div>
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
            {user.isDemo && <DemoBanner role={user.role} onCreateAccount={() => logout("/register")} />}
            {children}
          </div>
        </main>
      </div>
    </UserContext.Provider>
  )
}

/** Shown on the public demo accounts: explains the mode and lets visitors hop between views. */
function DemoBanner({ role, onCreateAccount }: { role: "teacher" | "student"; onCreateAccount: () => void }) {
  const other = role === "teacher" ? "student" : "teacher"
  return (
    <div className="relative mb-6 flex animate-rise flex-col gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
      <div className="absolute inset-0 bg-[radial-gradient(50%_120%_at_0%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]" />
      <div className="relative flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-medium">You&apos;re exploring the demo {role} account</p>
          <p className="text-muted-foreground">Real data, live features. Try it as a {other} too.</p>
        </div>
      </div>
      <div className="relative flex gap-2">
        <a
          href={`/demo/${other}`}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 sm:flex-none"
        >
          <ArrowLeftRight className="size-3.5" /> {other === "student" ? "Student view" : "Teacher view"}
        </a>
        <button
          onClick={onCreateAccount}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted sm:flex-none"
        >
          Create account
        </button>
      </div>
    </div>
  )
}
