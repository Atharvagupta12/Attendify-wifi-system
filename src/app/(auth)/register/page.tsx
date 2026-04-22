"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    rollNumber: "",
    className: "",
    section: "",
    macAddress: "",
    deviceName: "",
    teacherId: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (
      role === "student" &&
      (!form.rollNumber.trim() ||
        !form.className.trim() ||
        !form.section.trim() ||
        !form.macAddress.trim())
    ) {
      toast.error("Please fill all student fields");
      return;
    }

    if (role === "teacher" && !form.teacherId.trim()) {
      toast.error("Please enter Teacher ID");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        role === "teacher" ? "/api/register-teacher" : "/api/register-student";

      const payload =
        role === "teacher"
          ? {
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              teacherId: form.teacherId,
            }
          : {
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              rollNumber: form.rollNumber,
              className: form.className,
              section: form.section,
              macAddress: form.macAddress,
              deviceName: form.deviceName,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.message) {
        toast.success("Registered successfully 🎉");
        router.push("/login");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex-col justify-center items-center p-10">
        <h1 className="text-4xl font-bold mb-4">Attendify</h1>
        <p className="text-lg text-center max-w-md opacity-90">
          Smart attendance system powered by WiFi and ESP32.
        </p>
      </div>

      {/* Right */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-4">
          <h2 className="text-2xl font-semibold text-center">Create Account</h2>

          {/* Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setRole("student")}
              className={`flex-1 p-2 rounded ${
                role === "student" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              Student
            </button>

            <button
              onClick={() => setRole("teacher")}
              className={`flex-1 p-2 rounded ${
                role === "teacher" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              Teacher
            </button>
          </div>

          <input
            placeholder="Name"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <input
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <input
            placeholder="Phone"
            className="w-full border p-2 rounded"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
          />

          {role === "student" && (
            <>
              <input
                placeholder="Roll Number"
                className="w-full border p-2 rounded"
                value={form.rollNumber}
                onChange={(e) => handleChange("rollNumber", e.target.value)}
              />
              <input
                placeholder="Class"
                className="w-full border p-2 rounded"
                value={form.className}
                onChange={(e) => handleChange("className", e.target.value)}
              />
              <input
                placeholder="Section"
                className="w-full border p-2 rounded"
                value={form.section}
                onChange={(e) => handleChange("section", e.target.value)}
              />
              <input
                placeholder="Phone"
                className="w-full border p-2 rounded"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <input
                placeholder="MAC Address"
                className="w-full border p-2 rounded"
                value={form.macAddress}
                onChange={(e) => handleChange("macAddress", e.target.value)}
              />
              <input
                placeholder="Device Name"
                className="w-full border p-2 rounded"
                value={form.deviceName}
                onChange={(e) => handleChange("deviceName", e.target.value)}
              />
            </>
          )}

          {role === "teacher" && (
            <input
              placeholder="Teacher ID"
              className="w-full border p-2 rounded"
              value={form.teacherId}
              onChange={(e) => handleChange("teacherId", e.target.value)}
            />
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {loading ? "Please wait..." : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
