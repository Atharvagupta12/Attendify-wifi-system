import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { setAuthCookie, signToken } from "@/lib/auth"
import { isUniqueViolation, jsonError, parseBody, serverError } from "@/lib/api"
import { registerSchema } from "@/lib/validators"

export async function POST(req: Request) {
  const parsed = await parseBody(req, registerSchema)
  if (!parsed.ok) return parsed.response
  const input = parsed.data

  try {
    const password = await bcrypt.hash(input.password, 10)
    let id: string

    if (input.role === "teacher") {
      const existing = await prisma.teacher.findFirst({
        where: { OR: [{ email: input.email }, { teacherId: input.teacherId }] },
      })
      if (existing) {
        return jsonError(
          existing.email === input.email ? "Email is already registered" : "Teacher ID is already registered",
          409,
        )
      }
      const teacher = await prisma.teacher.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          teacherId: input.teacherId,
          password,
        },
      })
      id = teacher.id
    } else {
      const [cls, emailTaken, rollTaken, macTaken] = await Promise.all([
        prisma.class.findUnique({ where: { id: input.classId } }),
        prisma.student.findUnique({ where: { email: input.email } }),
        prisma.student.findFirst({ where: { classId: input.classId, rollNumber: input.rollNumber } }),
        prisma.device.findUnique({ where: { macAddress: input.macAddress } }),
      ])
      if (!cls) return jsonError("Selected class no longer exists", 400)
      if (emailTaken) return jsonError("Email is already registered", 409)
      if (rollTaken) return jsonError("This roll number is already registered in your class", 409)
      if (macTaken) return jsonError("This device is already registered to another student", 409)

      const student = await prisma.student.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          rollNumber: input.rollNumber,
          password,
          classId: cls.id,
          device: { create: { macAddress: input.macAddress, deviceName: input.deviceName || null } },
        },
      })
      id = student.id
    }

    // Sign the new user in straight away.
    const res = NextResponse.json(
      {
        message: "Account created",
        redirectTo: input.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
      },
      { status: 201 },
    )
    setAuthCookie(res, signToken({ id, role: input.role }))
    return res
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("An account with these details already exists", 409)
    return serverError("auth/register", error)
  }
}
