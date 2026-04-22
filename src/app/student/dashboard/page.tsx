"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { User, BookOpen, CheckCircle, XCircle } from "lucide-react";
import AttendanceChart from "@/components/AttendanceChart";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(u);

    fetch(`/api/schedule/student?studentId=${u.id}`)
      .then((res) => res.json())
      .then((res) => setUpcoming(res.data || []));

    fetch(`/api/attendance/student?studentId=${u.id}`)
      .then((res) => res.json())
      .then((res) => setData(res));
  }, []);

  if (!data) return <p className="p-6">Loading...</p>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl p-6 shadow mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Welcome, {user?.name || "Student"} 👋
            </h2>
            <p className="opacity-90">Track your attendance smartly</p>
          </div>

          <button
            onClick={() => alert("Attendance is auto-marked via WiFi")}
            className="bg-white text-indigo-600 px-5 py-2 rounded-lg font-medium shadow hover:scale-105 transition"
          >
            Mark Attendance
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
            <BookOpen className="text-blue-600" />
            <div>
              <p className="text-gray-500 text-sm">Total</p>
              <h3 className="text-xl font-bold">{data.stats.totalClasses}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
            <CheckCircle className="text-green-600" />
            <div>
              <p className="text-gray-500 text-sm">Present</p>
              <h3 className="text-xl font-bold text-green-600">
                {data.stats.present}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow flex items-center gap-4">
            <XCircle className="text-red-500" />
            <div>
              <p className="text-gray-500 text-sm">Absent</p>
              <h3 className="text-xl font-bold text-red-500">
                {data.stats.absent}
              </h3>
            </div>
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white p-4 rounded-xl mb-6 shadow">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold">Upcoming Classes</h3>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming classes</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((c: any, i: number) => (
                <div
                  key={i}
                  className="p-3 border rounded-lg flex justify-between"
                >
                  <div>
                    <p className="font-medium">{c.subject}</p>
                    <p className="text-sm text-gray-500">{c.class}</p>
                  </div>

                  <div className="text-right text-sm">
                    <p>{c.day}</p>
                    <p className="text-gray-500">{c.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold mb-4">
            Recent Attendance (Last 7 Days)
          </h3>

          {data.data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No attendance recorded in last 7 days.
            </div>
          ) : (
            <div className="space-y-4">
              {data.data.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 rounded-lg border hover:shadow-sm transition"
                >
                  <div>
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      item.status === "Present"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
