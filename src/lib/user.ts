import { prisma } from "./prisma"
import { getSession, type Role } from "./auth"
import { isDemoEmail } from "./demo"

export type CurrentUser = {
  id: string
  role: Role
  name: string
  email: string
  /** Teacher ID for teachers, roll number for students. */
  identifier: string
  className?: string
  /** True for the public demo accounts. */
  isDemo: boolean
}

/** Resolve the logged-in user (server components / route handlers). Null if not logged in. */
export async function getCurrentUser(req?: Request): Promise<CurrentUser | null> {
  const session = await getSession(req)
  if (!session) return null

  if (session.role === "teacher") {
    const t = await prisma.teacher.findUnique({ where: { id: session.id } })
    return t
      ? { id: t.id, role: "teacher", name: t.name, email: t.email, identifier: t.teacherId, isDemo: isDemoEmail(t.email) }
      : null
  }

  const s = await prisma.student.findUnique({ where: { id: session.id }, include: { class: true } })
  return s
    ? {
        id: s.id,
        role: "student",
        name: s.name,
        email: s.email,
        identifier: s.rollNumber,
        className: `${s.class.className}-${s.class.section}`,
        isDemo: isDemoEmail(s.email),
      }
    : null
}
