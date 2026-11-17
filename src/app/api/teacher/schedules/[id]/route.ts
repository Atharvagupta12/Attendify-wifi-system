import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, serverError } from "@/lib/api"
import { isDemoUser } from "@/lib/demo"

/** Delete one of the teacher's schedules (attendance and sessions cascade). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response
  const { id } = await params

  try {
    if (await isDemoUser(auth.session.id, "teacher")) {
      return jsonError("Deleting lectures is disabled on the demo account. Create your own account to try it.", 403)
    }
    // deleteMany with the owner in the filter: a teacher can never delete someone else's class.
    const { count } = await prisma.schedule.deleteMany({ where: { id, teacherId: auth.session.id } })
    if (count === 0) return jsonError("Class not found", 404)
    return NextResponse.json({ message: "Class deleted" })
  } catch (error) {
    return serverError("teacher/schedules DELETE", error)
  }
}
