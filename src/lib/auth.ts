import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export type Role = "teacher" | "student"

export type Session = {
  id: string
  role: Role
}

export const AUTH_COOKIE = "attendify_token"
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not configured")
  return secret
}

export function signToken(session: Session): string {
  return jwt.sign(session, getSecret(), { expiresIn: TOKEN_TTL_SECONDS })
}

export function verifyToken(token: string): Session | null {
  try {
    const decoded = jwt.verify(token, getSecret())
    if (
      typeof decoded === "object" &&
      typeof decoded.id === "string" &&
      (decoded.role === "teacher" || decoded.role === "student")
    ) {
      return { id: decoded.id, role: decoded.role }
    }
    return null
  } catch {
    return null
  }
}

/** Attach the session as an httpOnly cookie (not readable by page scripts). */
export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  })
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 })
}

/** Read the current session from the request cookie (or a Bearer header for API clients). */
export async function getSession(req?: Request): Promise<Session | null> {
  const header = req?.headers.get("authorization")
  if (header?.startsWith("Bearer ")) {
    return verifyToken(header.slice(7))
  }
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  return token ? verifyToken(token) : null
}

type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

/**
 * Guard for API routes. Usage:
 *   const auth = await requireRole(req, "teacher")
 *   if (!auth.ok) return auth.response
 */
export async function requireRole(req: Request, role: Role): Promise<AuthResult> {
  const session = await getSession(req)
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    }
  }
  if (session.role !== role) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  return { ok: true, session }
}
