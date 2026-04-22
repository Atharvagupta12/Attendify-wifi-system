"use client"

import Link from "next/link"
import { LayoutDashboard, Calendar, BarChart } from "lucide-react"

export default function TeacherSidebar() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : null

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-indigo-800 to-blue-900 text-white p-6 flex flex-col">

      {/* Profile */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3" />
        <h2 className="font-semibold">{user?.name || "Teacher"}</h2>
        <p className="text-sm opacity-70">Teacher</p>
      </div>

      {/* Nav */}
      <nav className="space-y-3">
        <Link href="/teacher/dashboard" className="p-3 bg-white/20 rounded-lg flex gap-2">
          <LayoutDashboard size={18} /> Dashboard
        </Link>

        <Link href="/teacher/schedule" className="p-3 flex gap-2">
          <Calendar size={18} /> Schedule
        </Link>

        <Link href="/teacher/attendance" className="p-3 flex gap-2">
          <BarChart size={18} /> Attendance
        </Link>
      </nav>

      <div className="mt-auto text-xs opacity-60 text-center">
        Attendify © 2026
      </div>
    </div>
  )
}