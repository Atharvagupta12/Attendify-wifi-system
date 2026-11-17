import { prisma } from "./prisma"
import { getSession, type Role } from "./auth"

export type CurrentUser = {
  id: string
  role: Role
  name: string
  email: string
  /** Teacher ID for teachers, roll number for students. */
  identifier: string
  className?: string
}

/** Resolve the logged-in user (server components / route handlers). Null if not logged in. */
export async function getCurrentUser(req?: Request): Promise<CurrentUser | null> {
  const session = await getSession(req)
  if (!session) return null

  if (session.role === "teacher") {
    const t = await prisma.teacher.findUnique({ where: { id: session.id } })
    return t
      ? { id: t.id, role: "teacher", name: t.name, email: t.email, identifier: t.teacherId }
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
      }
    : null
}
