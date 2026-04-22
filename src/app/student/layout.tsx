"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

export default function StudentLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/login")
    } else {
      const parsed = JSON.parse(user)

      if (parsed.role !== "student") {
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
    <div className="min-h-screen">

      <Navbar />

      <main className=" bg-slate-50">
        {children}
      </main>

    </div>
  )
}