import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { className, section } = await req.json()

    if (!className || !section) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      )
    }

    const existingClass = await prisma.class.findFirst({
      where: {
        className,
        section
      }
    })

    if (existingClass) {
      return NextResponse.json(
        { error: "Class already exists" },
        { status: 400 }
      )
    }

    const newClass = await prisma.class.create({
      data: {
        className,
        section
      }
    })

    return NextResponse.json({
      message: "Class created successfully",
      newClass
    })

  } catch (error) {

    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}