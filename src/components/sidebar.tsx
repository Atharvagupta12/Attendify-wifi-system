"use client"

import Link from "next/link"
import { LayoutDashboard, User } from "lucide-react"
import { useEffect, useState } from "react"

export default function Sidebar() {

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-indigo-700 via-blue-800 to-blue-900 text-white p-6 flex flex-col">

      {/* Profile */}
      <div className="mb-10 text-center">

        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
          <User size={28} />
        </div>

        <h2 className="font-semibold text-lg">
         {user?.name || "Student"}
        </h2>

        <p className="text-sm opacity-70">Role - Student</p>

        <p className="text-sm opacity-70">
          Roll No - {user?.rollNumber || "-"}
        </p>

      </div>

      {/* Nav */}
      <nav className="space-y-3">

        <Link
          href="/student/dashboard"
          className="flex items-center gap-3 p-3 rounded-lg bg-white/20"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

      </nav>

      {/* Footer */}
      <div className="mt-auto text-xs opacity-60 text-center">
        Attendify © 2026
      </div>

    </div>
  )
}