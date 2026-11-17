import { prisma } from "./prisma"
import type { Role } from "./auth"

/** Public demo accounts created by `npm run db:seed`. */
export const DEMO_EMAILS: Record<Role, string> = {
  teacher: "teacher@demo.attendify.app",
  student: "student@demo.attendify.app",
}

export function isDemoEmail(email: string): boolean {
  return email.endsWith("@demo.attendify.app")
}

/**
 * Demo access is on by default (it's a portfolio project) and decided at
 * runtime, so it works on any deployment without build-time variables.
 * Set DEMO_MODE=false to turn it off.
 */
export async function isDemoAvailable(): Promise<boolean> {
  if (process.env.DEMO_MODE === "false") return false
  try {
    const teacher = await prisma.teacher.findUnique({ where: { email: DEMO_EMAILS.teacher }, select: { id: true } })
    return teacher !== null
  } catch {
    return false
  }
}

/** Whether the given user id belongs to a demo account (used to protect demo data). */
export async function isDemoUser(id: string, role: Role): Promise<boolean> {
  const user =
    role === "teacher"
      ? await prisma.teacher.findUnique({ where: { id }, select: { email: true } })
      : await prisma.student.findUnique({ where: { id }, select: { email: true } })
  return !!user && isDemoEmail(user.email)
}
