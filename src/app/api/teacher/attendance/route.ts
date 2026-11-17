import { NextResponse } from "next/server"
import { z } from "zod"
import { requireRole } from "@/lib/auth"
import { parseQuery, serverError } from "@/lib/api"
import { getTeacherOccurrences } from "@/lib/attendance"
import { dateKey, now } from "@/lib/time"

const query = z.object({
  days: z.coerce.number().int().min(1).max(180).default(30),
})

/** Lecture history: one entry per held lecture with present/total counts. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  const parsed = parseQuery(req, query)
  if (!parsed.ok) return parsed.response

  try {
    const n = now()
    const data = await getTeacherOccurrences(
      auth.session.id,
      dateKey(n.subtract(parsed.data.days - 1, "day")),
      dateKey(n),
    )
    return NextResponse.json({ data })
  } catch (error) {
    return serverError("teacher/attendance", error)
  }
}
