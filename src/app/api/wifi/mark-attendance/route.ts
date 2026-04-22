import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import dayjs from "dayjs"

export async function POST(req: Request) {
  try {
    const { macAddresses } = await req.json()

    if (!macAddresses || macAddresses.length === 0) {
      return NextResponse.json(
        { error: "No MAC addresses provided" },
        { status: 400 }
      )
    }

    const now = dayjs()

    const currentDay = now.format("dddd").toUpperCase()

    const currentMinutes =
      now.hour() * 60 + now.minute()

    // 🔥 Get today's schedules
    const schedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek: currentDay
      },
      include: {
        class: true
      }
    })

    // 🔥 Find active schedules based on time
    const activeSchedules = schedules.filter((sch) => {
      const start = dayjs(sch.startTime)
      const end = dayjs(sch.endTime)

      const startMin =
        start.hour() * 60 + start.minute()

      const endMin =
        end.hour() * 60 + end.minute()

      return (
        currentMinutes >= startMin &&
        currentMinutes <= endMin
      )
    })

    if (activeSchedules.length === 0) {
      return NextResponse.json({
        message: "No active class right now"
      })
    }

    const results = []

    for (const mac of macAddresses) {

      const device = await prisma.device.findUnique({
        where: { macAddress: mac },
        include: {
          student: true
        }
      })

      if (!device || !device.student) continue

      const student = device.student

      // 🔥 Match student's class
      const matchedSchedule =
        activeSchedules.find(
          (s) => s.classId === student.classId
        )

      if (!matchedSchedule) continue

      const today = now.startOf("day").toDate()

      // prevent duplicate
      const existing =
        await prisma.attendance.findFirst({
          where: {
            studentId: student.id,
            scheduleId: matchedSchedule.id,
            date: today
          }
        })

      if (existing) continue

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          scheduleId: matchedSchedule.id,
          date: today,
          status: "Present"
        }
      })

      results.push({
        student: student.name,
        status: "Marked Present"
      })
    }

    return NextResponse.json({
      message: "Attendance processed",
      results
    })

  } catch (error) {

    console.log("❌ Attendance Error:", error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}