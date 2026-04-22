"use client"

import { useEffect, useState } from "react"

export default function AttendancePage() {

  const [data, setData] = useState([])

  useEffect(() => {
    fetch("/api/attendance/teacher?teacherId=YOUR_ID")
      .then(res => res.json())
      .then(res => setData(res.data))
  }, [])
  
  // downloading attendance
  const downloadCSV = (attendance: any[]) => {
  const rows = [
    ["Roll", "Name", "Status"],
    ...attendance.map(s => [s.rollNumber, s.name, s.status])
  ]

  const csv = rows.map(r => r.join(",")).join("\n")

  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "attendance.csv"
  a.click()
}

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold">Attendance</h2>

      {data.map((cls: any) => (
        <div key={cls.scheduleId} className="bg-white p-4 rounded-lg shadow">

          <h3 className="font-semibold mb-3">
            {cls.subject} - {cls.class}
          </h3>

          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Roll</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {cls.attendance.map((student: any) => (
                <tr key={student.studentId} className="text-center border-t">
                  <td>{student.rollNumber}</td>
                  <td>{student.name}</td>
                  <td className={
                    student.status === "Present"
                      ? "text-green-600"
                      : "text-red-500"
                  }>
                    {student.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => downloadCSV(cls.attendance)}
            className="bg-green-600 text-white px-3 py-1 rounded mb-2"
          >
           Download CSV
          </button>

        </div>
      ))}

    </div>
  )
}