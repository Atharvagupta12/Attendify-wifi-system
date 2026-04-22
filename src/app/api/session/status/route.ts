import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId required" },
        { status: 400 }
      )
    }

    const now = new Date()

    const session = await prisma.attendanceSession.findFirst({
      where: {
        isActive: true,
        expiresAt: {
          gte: now
        },
        schedule: {
          teacherId
        }
      },
      include: {
        schedule: {
          include: {
            class: true,
            subject: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({
        active: false
      })
    }

    return NextResponse.json({
      active: true,
      expiresAt: session.expiresAt,
      subject: session.schedule.subject.subjectName,
      class: `${session.schedule.class.className}-${session.schedule.class.section}`
    })

  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}