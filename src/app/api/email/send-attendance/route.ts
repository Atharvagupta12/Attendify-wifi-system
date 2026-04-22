import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/mailer"
import dayjs from "dayjs"

export async function POST(req: Request) {
  try {

    const { scheduleId } = await req.json()

    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId required" },
        { status: 400 }
      )
    }

    //  Get schedule details
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        teacher: true,
        class: true,
        subject: true
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    const today = dayjs().startOf("day").toDate()

    //  Get students of class
    const students = await prisma.student.findMany({
      where: {
        classId: schedule.classId
      }
    })

    //  Get attendance
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        scheduleId,
        date: today
      }
    })

    const presentIds = attendanceRecords.map(a => a.studentId)

    //  Build HTML
    let html = `
      <h2>Attendance Report</h2>
      <p><strong>Subject:</strong> ${schedule.subject.subjectName}</p>
      <p><strong>Class:</strong> ${schedule.class.className}-${schedule.class.section}</p>
      <p><strong>Date:</strong> ${dayjs().format("YYYY-MM-DD")}</p>
      <br/>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Roll No</th>
          <th>Name</th>
          <th>Status</th>
        </tr>
    `

    for (const student of students) {
      const isPresent = presentIds.includes(student.id)

      html += `
        <tr>
          <td>${student.rollNumber}</td>
          <td>${student.name}</td>
          <td>${isPresent ? "Present" : "Absent"}</td>
        </tr>
      `
    }

    html += `</table>`

    //  Send email
    await sendEmail(
      schedule.teacher.email,
      "Attendance Report",
      html
    )

    return NextResponse.json({
      message: "Email sent successfully"
    })

  } catch (error) {

    console.log(error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}