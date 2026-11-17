import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import AppShell from "@/components/app-shell"
import { getCurrentUser } from "@/lib/user"

// Server-side guard: the JWT cookie is verified before any teacher page renders.
export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "teacher") redirect("/student/dashboard")

  return <AppShell user={user}>{children}</AppShell>
}
