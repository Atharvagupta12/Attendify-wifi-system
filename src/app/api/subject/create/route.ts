import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { subjectName, subjectCode } = await req.json()

    if (!subjectName || !subjectCode) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      )
    }

    const existingSubject = await prisma.subject.findUnique({
      where: {
        subjectCode
      }
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: "Subject already exists" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        subjectName,
        subjectCode
      }
    })

    return NextResponse.json({
      message: "Subject created successfully",
      subject
    })

  } catch (error) {

    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}