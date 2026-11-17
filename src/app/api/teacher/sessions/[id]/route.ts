import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, serverError } from "@/lib/api"

/** Stop an active attendance session early. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response
  const { id } = await params

  try {
    const { count } = await prisma.attendanceSession.updateMany({
      where: { id, isActive: true, schedule: { teacherId: auth.session.id } },
      data: { isActive: false, endedAt: new Date() },
    })
    if (count === 0) return jsonError("No active session found", 404)
    return NextResponse.json({ message: "Session ended" })
  } catch (error) {
    return serverError("teacher/sessions DELETE", error)
  }
}
