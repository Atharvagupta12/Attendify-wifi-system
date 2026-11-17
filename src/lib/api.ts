import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import type { ZodType } from "zod"

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse }

/** Parse and validate a JSON body; returns a 400 with the first validation message on failure. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<ParseResult<T>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body", 400) }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue.path.join(".")
    return {
      ok: false,
      response: jsonError(field ? `${field}: ${issue.message}` : issue.message, 400),
    }
  }
  return { ok: true, data: result.data }
}

/** Parse query parameters with a schema. */
export function parseQuery<T>(req: Request, schema: ZodType<T>): ParseResult<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const result = schema.safeParse(params)
  if (!result.success) {
    const issue = result.error.issues[0]
    return { ok: false, response: jsonError(`${issue.path.join(".")}: ${issue.message}`, 400) }
  }
  return { ok: true, data: result.data }
}

/** Log unexpected errors server-side and return a generic 500 (never leak internals). */
export function serverError(context: string, error: unknown) {
  console.error(`[${context}]`, error)
  return jsonError("Something went wrong. Please try again.", 500)
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}
