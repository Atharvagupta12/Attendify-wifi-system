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

    const schedules = await prisma.schedule.findMany({
      where: {
        teacherId
      },
      include: {
        class: true,
        subject: true
      },
      orderBy: {
        id: "desc"
      }
    })

    const data = schedules.map((s) => ({
      scheduleId: s.id,
      subject: s.subject.subjectName,
      class: `${s.class.className}-${s.class.section}`,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime
    }))

    return NextResponse.json({ data })

  } catch (error) {
    console.log("❌ Teacher Schedule Error:", error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}