"use client";

import { useEffect, useState } from "react";
import { Plus, PlayCircle, Users } from "lucide-react";
import toast from "react-hot-toast";
import CreateClassModal from "@/components/CreateClassModal";
import TeacherSidebar from "@/components/TeacherSidebar";

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH DATA
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");

    if (!u?.id) return;

    setUser(u);

    const fetchData = async () => {
      try {
        setLoading(true);

        const [classRes, attendanceRes] = await Promise.all([
          fetch(`/api/schedule/teacher?teacherId=${u.id}`),
          fetch(`/api/attendance/teacher?teacherId=${u.id}`),
        ]);

        const classData = await classRes.json();
        const attendanceData = await attendanceRes.json();

        console.log("CLASSES API:", classData);

        setClasses(classData.data || []);
        setAttendance(attendanceData.data || []);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(async () => {
      const res = await fetch(`/api/attendance/teacher?teacherId=${u.id}`);

      const data = await res.json();

      setAttendance(data.data || []);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 DELETE CLASS
  const handleDelete = async (id: string) => {
  const ok = confirm("Delete this class?");
  if (!ok) return;

  try {
    const res = await fetch("/api/schedule/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheduleId: id }),
    });

    const data = await res.json();

    if (data.message) {
      toast.success("Class deleted");

      setClasses((prev: any) =>
        prev.filter((c: any) => c.scheduleId !== id)
      );
    } else {
      toast.error(data.error || "Delete failed");
    }
  } catch (err) {
    toast.error("Delete failed");
    console.log(err);
  }
};

  // 🔥 HELPERS
  const sendEmail = () => toast("Email feature coming soon");
  const viewAttendance = () => toast("Detailed view coming soon");

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen">
      <TeacherSidebar />

      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        {/* HEADER */}
        <h1 className="text-2xl font-semibold mb-6">
          Welcome, {user?.name || "Teacher"} 👋
        </h1>

        {/* CLASS CARDS */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {/* CREATE CARD */}
          <div
            onClick={() => setOpen(true)}
            className="bg-white p-5 rounded-2xl shadow cursor-pointer hover:shadow-lg transition flex items-center gap-3"
          >
            <Plus />
            <span className="font-medium">Create Class</span>
          </div>

          {/* CLASS LIST */}
          {classes.map((cls: any, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition relative border"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-lg">{cls.subject}</p>
                  <p className="text-sm text-gray-500">{cls.class}</p>

                  <p className="text-xs mt-2 text-gray-600">{cls.dayOfWeek}</p>

                  <p className="text-xs text-gray-600">
                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(cls.scheduleId)}
                  className="text-red-500 text-sm hover:text-red-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

          <div className="flex gap-4">
            <button
              onClick={() => setOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 transition text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Create Class
            </button>

            <button
              onClick={() => toast("ESP32 attendance will trigger here")}
              className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle size={16} /> Start Attendance
            </button>

            <button
              onClick={() => toast("Coming soon")}
              className="bg-yellow-400 hover:bg-yellow-500 transition px-5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Users size={16} /> View Students
            </button>
          </div>
        </div>

        {/* UPCOMING */}
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Upcoming Sessions</h3>
            <button
              onClick={() => toast("Full schedule page next")}
              className="text-blue-600 text-sm cursor-pointer"
            >
              View All
            </button>
          </div>

          {classes.length === 0 ? (
            <p className="text-gray-500">No upcoming sessions</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {classes.slice(0, 3).map((cls: any, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border"
                >
                  <p className="font-medium">{cls.subject}</p>
                  <p className="text-sm text-gray-500">{cls.class}</p>

                  <div className="flex justify-between mt-3 text-xs text-gray-600">
                    <span>{cls.dayOfWeek}</span>
                    <span>
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ATTENDANCE */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Recent Attendance</h3>
            <button
              onClick={() => toast("Full attendance page next")}
              className="text-blue-600 text-sm cursor-pointer"
            >
              View All
            </button>
          </div>

          {attendance.length === 0 ? (
            <p className="text-gray-500">No attendance recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {attendance.slice(0, 3).map((cls: any, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">
                      {cls.subject} • {cls.class}
                    </p>

                    <div className="flex gap-3 text-sm">
                      <button
                        onClick={() => viewAttendance(cls)}
                        className="text-blue-600 cursor-pointer"
                      >
                        View
                      </button>

                      <button
                        onClick={() => downloadCSV(cls.attendance)}
                        className="text-green-600 cursor-pointer"
                      >
                        Download
                      </button>

                      <button
                        onClick={() => sendEmail()}
                        className="text-purple-600 cursor-pointer"
                      >
                        Email
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    {
                      cls.attendance.filter((s: any) => s.status === "Present")
                        .length
                    }{" "}
                    present
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL */}
        <CreateClassModal
          open={open}
          setOpen={setOpen}
          onSuccess={() => {
            // 🔥 REFETCH instead of fake update
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}

// 🔥 CSV DOWNLOAD
function downloadCSV(attendance: any[]) {
  const rows = [
    ["Roll", "Name", "Status"],
    ...attendance.map((s) => [s.rollNumber, s.name, s.status]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance.csv";
  a.click();
}
