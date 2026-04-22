"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/login")
    } else {
      const parsed = JSON.parse(user)

      if (parsed.role !== "teacher") {
        router.push("/login")
      } else {
        setLoading(false)
      }
    }
  }, [])

  if (loading) {
    return <div className="p-6">Checking authentication...</div>
  }

  return (
    <div className="h-screen flex flex-col">

      <Navbar />

      <div className="flex flex-1">

        <main className="flex-1  bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  )
}