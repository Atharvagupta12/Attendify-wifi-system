import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import AppShell from "@/components/app-shell"
import { getCurrentUser } from "@/lib/user"

// Server-side guard: the JWT cookie is verified before any student page renders.
export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "student") redirect("/teacher/dashboard")

  return <AppShell user={user}>{children}</AppShell>
}
