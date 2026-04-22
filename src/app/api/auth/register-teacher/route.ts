import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {

    const body = await req.json()

    const { name, teacherId, email, phone, password } = body

    if (!name || !teacherId || !email || !phone || !password) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      )
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { email },
          { teacherId }
        ]
      }
    })

    if (existingTeacher) {
      return NextResponse.json(
        { error: "Teacher already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const teacher = await prisma.teacher.create({
      data: {
        name,
        teacherId,
        email,
        phone,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      message: "Teacher registered successfully",
      teacher
    })

  } catch (error) {

    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}