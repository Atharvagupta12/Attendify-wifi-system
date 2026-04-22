import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import dayjs from "dayjs"

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

    const sevenDaysAgo = dayjs().subtract(7, "day").startOf("day").toDate()

    // 🔥 Fetch attendance
    const records = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: sevenDaysAgo
        }
      },
      include: {
        schedule: {
          include: {
            subject: true,
            class: true
          }
        }
      },
      orderBy: {
        date: "desc"
      }
    })

    // 🔥 Format data
    const data = records.map((rec) => ({
      date: dayjs(rec.date).format("YYYY-MM-DD"),
      subject: rec.schedule.subject.subjectName,
      class: `${rec.schedule.class.className}-${rec.schedule.class.section}`,
      time: `${rec.schedule.startTime} - ${rec.schedule.endTime}`,
      status: rec.status
    }))

    // 🔥 Stats
    const total = data.length
    const present = data.filter((d) => d.status === "Present").length
    const absent = total - present

    // 🔥 SUBJECT-WISE ANALYSIS (NEW)
    const subjectMap: any = {}

    data.forEach((item) => {
      if (!subjectMap[item.subject]) {
        subjectMap[item.subject] = {
          present: 0,
          total: 0
        }
      }

      subjectMap[item.subject].total++

      if (item.status === "Present") {
        subjectMap[item.subject].present++
      }
    })

    const subjectStats = Object.keys(subjectMap).map((key) => ({
      subject: key,
      present: subjectMap[key].present,
      total: subjectMap[key].total
    }))

    return NextResponse.json({
      stats: {
        totalClasses: total,
        present,
        absent,
        attendancePercentage:
          total === 0 ? 0 : ((present / total) * 100).toFixed(2)
      },
      data,
      subjectStats // 🔥 NEW FIELD
    })

  } catch (error: any) {
  console.log("MARK ATTENDANCE ERROR:", error)
  return NextResponse.json(
    {
      error: "Server error",
      details: error?.message || "unknown"
    },
    { status: 500 }
  )
}
}