import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import dayjs from "dayjs"

const days = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
]

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId required" },
        { status: 400 }
      )
    }

    // 🔥 get student class
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    const today = dayjs().day() // 0–6
    const nowTime = dayjs().format("HH:mm")

    // 🔥 get all schedules for this class
    const schedules = await prisma.schedule.findMany({
      where: {
        classId: student.classId
      },
      include: {
        subject: true,
        class: true
      }
    })

    const upcoming: any[] = []

    schedules.forEach((s) => {
      const scheduleDayIndex = days.indexOf(s.dayOfWeek)

      if (scheduleDayIndex === -1) return

      const isToday = scheduleDayIndex === today

      // 🔥 convert time
      const start = dayjs(s.startTime).format("HH:mm")

      if (
        (isToday && start > nowTime) || // later today
        scheduleDayIndex > today        // future day
      ) {
        upcoming.push({
          subject: s.subject.subjectName,
          class: `${s.class.className}-${s.class.section}`,
          day: s.dayOfWeek,
          time: `${dayjs(s.startTime).format("hh:mm A")} - ${dayjs(s.endTime).format("hh:mm A")}`
        })
      }
    })

    // 🔥 sort properly
    upcoming.sort((a, b) => {
      const dayDiff =
        days.indexOf(a.day) - days.indexOf(b.day)
      return dayDiff !== 0 ? dayDiff : 0
    })

    return NextResponse.json({
      data: upcoming.slice(0, 3) // only next 3
    })

  } catch (error) {
    console.log("❌ Student Upcoming Error:", error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}