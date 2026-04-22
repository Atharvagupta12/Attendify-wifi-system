"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function AttendanceChart({ data }: any) {

  const formatted = data.map((d: any) => ({
    subject: d.subject,
    attendance: Math.round((d.present / d.total) * 100)
  }))

  return (
    <div className="bg-white p-6 rounded-2xl shadow">

      <h3 className="text-lg font-semibold mb-4">
        Subject-wise Attendance
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="attendance" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}