import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { jsonError, parseBody, serverError } from "@/lib/api"
import { getRoster } from "@/lib/attendance"
import { dateKeySchema } from "@/lib/validators"
import { escapeHtml, isEmailConfigured, sendEmail } from "@/lib/mailer"
import { toCsv } from "@/lib/csv"
import { formatTime12 } from "@/lib/time"

const body = z.object({ scheduleId: z.string().uuid(), date: dateKeySchema })

/** Email the attendance report for one lecture to the logged-in teacher (HTML + CSV attachment). */
export async function POST(req: Request) {
  const auth = await requireRole(req, "teacher")
  if (!auth.ok) return auth.response

  const parsed = await parseBody(req, body)
  if (!parsed.ok) return parsed.response

  if (!isEmailConfigured()) return jsonError("Email is not configured on the server", 503)

  try {
    const [roster, teacher] = await Promise.all([
      getRoster(parsed.data.scheduleId, parsed.data.date),
      prisma.teacher.findUnique({ where: { id: auth.session.id } }),
    ])
    if (!roster || !teacher || roster.schedule.teacherId !== teacher.id) return jsonError("Class not found", 404)

    const { schedule, summary, students, date } = roster
    const rows = students
      .map(
        (s) => `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(s.rollNumber)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(s.name)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;color:${s.status === "Present" ? "#15803d" : "#b91c1c"}">${s.status}</td>
        </tr>`,
      )
      .join("")

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="margin:0 0 4px">Attendance report</h2>
        <p style="margin:0 0 16px;color:#555">
          ${escapeHtml(schedule.subject)} · ${escapeHtml(schedule.class)} · ${date} ·
          ${formatTime12(schedule.startTime)}–${formatTime12(schedule.endTime)}
        </p>
        <p><strong>${summary.present}</strong> present, <strong>${summary.absent}</strong> absent, ${summary.total} total</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr style="text-align:left;background:#f5f5f5">
            <th style="padding:6px 12px">Roll</th><th style="padding:6px 12px">Name</th><th style="padding:6px 12px">Status</th>
          </tr>
          ${rows}
        </table>
      </div>`

    const csv = toCsv([["Roll", "Name", "Status"], ...students.map((s) => [s.rollNumber, s.name, s.status])])

    await sendEmail(
      teacher.email,
      `Attendance: ${schedule.subject} ${schedule.class} (${date})`,
      html,
      { filename: `attendance-${schedule.class}-${date}.csv`, content: csv },
    )

    return NextResponse.json({ message: `Report sent to ${teacher.email}` })
  } catch (error) {
    return serverError("teacher/attendance/email", error)
  }
}
