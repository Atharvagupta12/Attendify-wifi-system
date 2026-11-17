import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { setAuthCookie, signToken } from "@/lib/auth"
import { DEMO_EMAILS } from "@/lib/demo"

/**
 * One-tap demo: GET /demo/teacher or /demo/student signs the visitor into the
 * public demo account and opens its dashboard. Works from any link (landing
 * page, résumé, phone) and never ships the demo password to the browser.
 */
export async function GET(req: Request, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  const url = new URL(req.url)

  if (process.env.DEMO_MODE === "false" || (role !== "teacher" && role !== "student")) {
    return NextResponse.redirect(new URL("/login", url))
  }

  const user =
    role === "teacher"
      ? await prisma.teacher.findUnique({ where: { email: DEMO_EMAILS.teacher }, select: { id: true } })
      : await prisma.student.findUnique({ where: { email: DEMO_EMAILS.student }, select: { id: true } })

  if (!user) return NextResponse.redirect(new URL("/login", url))

  const res = NextResponse.redirect(new URL(`/${role}/dashboard`, url))
  setAuthCookie(res, signToken({ id: user.id, role }))
  return res
}
