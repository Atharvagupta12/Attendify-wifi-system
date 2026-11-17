"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Wifi,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CurrentUser } from "@/lib/user"

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

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wifi className="size-4" />
      </span>
      Attendify
    </span>
  )
}

export default function AppShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" className="px-2 pt-1">
        <Logo />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV[user.role].map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-xl border bg-background p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.role === "teacher" ? `Teacher · ${user.identifier}` : `${user.className} · Roll ${user.identifier}`}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </div>
  )

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen bg-muted/40">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar md:block">{sidebar}</aside>

        {/* Mobile top bar + drawer */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <Logo />
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-muted">
            <Menu className="size-5" />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
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

        <main className="md:pl-64">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </UserContext.Provider>
  )
}
