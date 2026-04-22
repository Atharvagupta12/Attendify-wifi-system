"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export default function CreateClassModal({ open, setOpen, onSuccess }: any) {

  const [form, setForm] = useState({
    className: "",
    section: "",
    subjectName: "",
    dayOfWeek: "",
    startTime: "",
    endTime: ""
  })

  const handleCreate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      const res = await fetch("/api/schedule/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          teacherId: user.id,
          ...form
        })
      })

      const data = await res.json()

      if (data.data) {
        toast.success("Class created successfully")

        onSuccess() // 🔥 update parent
        setOpen(false)

      } else {
        toast.error(data.error)
      }

    } catch {
      toast.error("Error creating class")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white p-6 rounded-xl w-96 space-y-3">

        <h2 className="text-lg font-semibold">Create Class</h2>

        <input
          placeholder="Class (e.g 3rd)"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({ ...form, className: e.target.value })
          }
        />

        <input
          placeholder="Section (A/B)"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({ ...form, section: e.target.value })
          }
        />

        <input
          placeholder="Subject"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({ ...form, subjectName: e.target.value })
          }
        />

        <input
          placeholder="Day (MONDAY)"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({ ...form, dayOfWeek: e.target.value })
          }
        />

        <input
          type="time"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({ ...form, startTime: e.target.value })
          }
        />

        <input
          type="time"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            setForm({ ...form, endTime: e.target.value })
          }
        />

        <div className="flex gap-3 pt-2">

          <button
            onClick={() => setOpen(false)}
            className="flex-1 border rounded p-2"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="flex-1 bg-blue-600 text-white rounded p-2"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  )
}