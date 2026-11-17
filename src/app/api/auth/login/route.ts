import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { setAuthCookie, signToken } from "@/lib/auth"
import { jsonError, parseBody, serverError } from "@/lib/api"
import { loginSchema } from "@/lib/validators"

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("attendify-dummy-password", 10)

export async function POST(req: Request) {
  const parsed = await parseBody(req, loginSchema)
  if (!parsed.ok) return parsed.response
  const { email, password, role } = parsed.data

  try {
    const user =
      role === "teacher"
        ? await prisma.teacher.findUnique({ where: { email } })
        : await prisma.student.findUnique({ where: { email } })

    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)
    if (!user || !valid) return jsonError("Invalid email or password", 401)

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role },
      redirectTo: role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
    })
    setAuthCookie(res, signToken({ id: user.id, role }))
    return res
  } catch (error) {
    return serverError("auth/login", error)
  }
}
