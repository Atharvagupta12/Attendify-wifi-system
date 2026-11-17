/**
 * Demo data so the app can be explored without hardware:
 *   - demo teacher + demo student (password: demo1234)
 *   - class 10-A with 12 students and a timetable
 *   - ~3 weeks of realistic attendance history
 *
 * Safe to re-run: only rows belonging to the demo accounts/class are touched.
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()
const TZ = process.env.APP_TIMEZONE || "Asia/Kolkata"
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

const localKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d) // YYYY-MM-DD
const dbDate = (key) => new Date(`${key}T00:00:00.000Z`)

const STUDENTS = [
  "Aarav Mehta", "Diya Patel", "Kabir Singh", "Ananya Iyer", "Vihaan Rao", "Ishita Gupta",
  "Arjun Nair", "Meera Joshi", "Rohan Das", "Saanvi Kapoor", "Aditya Verma", "Kavya Reddy",
]

// Weekday timetable for 10-A, taught by the demo teacher.
const TIMETABLE = [
  ["Mathematics", "MONDAY", "09:00", "10:00"],
  ["Physics", "MONDAY", "11:00", "12:00"],
  ["Mathematics", "TUESDAY", "10:00", "11:00"],
  ["Computer Science", "WEDNESDAY", "09:00", "10:30"],
  ["Physics", "THURSDAY", "09:00", "10:00"],
  ["Mathematics", "FRIDAY", "11:00", "12:00"],
  ["Computer Science", "SATURDAY", "10:00", "11:30"],
]

async function main() {
  const password = await bcrypt.hash("demo1234", 10)
  const historyStart = new Date(Date.now() - 21 * 86400000)

  const teacher = await prisma.teacher.upsert({
    where: { email: "teacher@demo.attendify.app" },
    update: {},
    create: { name: "Priya Sharma", teacherId: "DEMO-T01", email: "teacher@demo.attendify.app", phone: "+919800000001", password },
  })

  const cls = await prisma.class.upsert({
    where: { className_section: { className: "10", section: "A" } },
    update: {},
    create: { className: "10", section: "A" },
  })

  // Students (first one is the demo login)
  const students = []
  for (const [i, name] of STUDENTS.entries()) {
    const email = i === 0 ? "student@demo.attendify.app" : `${name.split(" ")[0].toLowerCase()}@demo.attendify.app`
    const mac = `02:DE:00:00:00:${String(i + 1).padStart(2, "0")}`
    const student = await prisma.student.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        phone: `+9198000001${String(i).padStart(2, "0")}`,
        rollNumber: String(i + 1),
        password,
        classId: cls.id,
        createdAt: historyStart,
        device: { create: { macAddress: mac, deviceName: "Demo phone" } },
      },
    })
    students.push(student)
  }

  // Timetable (recreate the demo teacher's slots so the seed is idempotent)
  await prisma.schedule.deleteMany({ where: { teacherId: teacher.id } })
  const schedules = []
  for (const [subjectName, dayOfWeek, startTime, endTime] of TIMETABLE) {
    const subject =
      (await prisma.subject.findFirst({ where: { subjectName } })) ??
      (await prisma.subject.create({
        data: { subjectName, subjectCode: `${subjectName.slice(0, 3).toUpperCase()}${100 + schedules.length}D` },
      }))
    schedules.push(
      await prisma.schedule.create({
        data: { teacherId: teacher.id, classId: cls.id, subjectId: subject.id, dayOfWeek, startTime, endTime, createdAt: historyStart },
      }),
    )
  }

  // Attendance history: each student has a personal attendance rate (some below 75%).
  const rows = []
  const nowKey = localKey(new Date())
  const nowTime = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
  for (let d = 0; d <= 21; d++) {
    const date = new Date(historyStart.getTime() + d * 86400000)
    const key = localKey(date)
    const weekday = DAYS[new Date(`${key}T12:00:00Z`).getUTCDay()]
    for (const s of schedules) {
      if (s.dayOfWeek !== weekday) continue
      if (key > nowKey || (key === nowKey && s.endTime > nowTime)) continue // only finished lectures
      students.forEach((st, i) => {
        const rate = [0.95, 0.9, 0.62, 0.88, 0.97, 0.7, 0.85, 0.92, 0.55, 0.9, 0.8, 0.93][i]
        if (Math.random() < rate) {
          rows.push({ studentId: st.id, scheduleId: s.id, date: dbDate(key), status: "Present", source: "WIFI" })
        }
      })
    }
  }
  await prisma.attendance.createMany({ data: rows, skipDuplicates: true })

  console.log(`Seeded: teacher ${teacher.email}, ${students.length} students in 10-A, ${schedules.length} weekly lectures, ${rows.length} attendance records.`)
  console.log("Log in with teacher@demo.attendify.app / demo1234 or student@demo.attendify.app / demo1234")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
