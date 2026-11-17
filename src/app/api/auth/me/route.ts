import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/user"
import { jsonError } from "@/lib/api"

export async function GET(req: Request) {
  const user = await getCurrentUser(req)
  if (!user) return jsonError("Not authenticated", 401)
  return NextResponse.json({ user })
}
