"use client"

import Link from "next/link"

export default function Navbar() {

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null

  return (
    <div className="flex justify-between items-center p-4 bg-white border-b">

      <h1 className="font-bold text-blue-600">Attendify</h1>

      <div className="space-x-4">

        <Link href="/">Home</Link>

        {user?.role === "teacher" && (
          <>
            <Link href="/teacher/dashboard">Dashboard</Link>
            <Link href="/teacher/attendance">Attendance</Link>
            <Link href="/teacher/schedule">Schedule</Link>
          </>
        )}

        {user?.role === "student" && (
          <Link href="/student/dashboard">Dashboard</Link>
        )}

        <Link href="/login">Logout</Link>

      </div>

    </div>
  )
}