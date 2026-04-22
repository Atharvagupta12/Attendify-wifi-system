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

    const records = await prisma.attendance.findMany({
      where: {
        schedule: {
          teacherId
        }
      },
      include: {
        student: true,
        schedule: {
          include: {
            class: true,
            subject: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: 20
    })

    const grouped: any = {}

    for (const rec of records) {
      const key = rec.scheduleId

      if (!grouped[key]) {
        grouped[key] = {
          scheduleId: rec.scheduleId,
          subject: rec.schedule.subject.subjectName,
          class: `${rec.schedule.class.className}-${rec.schedule.class.section}`,
          attendance: []
        }
      }

      grouped[key].attendance.push({
        studentId: rec.student.id,
        name: rec.student.name,
        rollNumber: rec.student.rollNumber,
        status: rec.status
      })
    }

    return NextResponse.json({
      data: Object.values(grouped)
    })

  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}