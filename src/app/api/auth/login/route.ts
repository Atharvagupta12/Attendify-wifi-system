import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, password, role } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      )
    }

    let user: any

    if (role === "teacher") {
      user = await prisma.teacher.findUnique({
        where: { email }
      })
    } else if (role === "student") {
      user = await prisma.student.findUnique({
        where: { email }
      })
    } else {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        id: user.id,
        role
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        className: user.className,
        section: user.section,
        role
      }
    })

  } catch (error) {

    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}