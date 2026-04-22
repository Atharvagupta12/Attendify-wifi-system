"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, User, GraduationCap } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({});

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const endpoint = isLogin
        ? "/api/auth/login"
        : role === "teacher"
          ? "/api/auth/register-teacher"
          : "/api/auth/register-student";

      const body = isLogin
        ? { email: form.email, password: form.password, role }
        : form;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        toast.success("Login successful 🚀");

        router.push(
          role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
        );
      } else if (data.message) {
        toast.success("Registered successfully 🎉");
        setIsLogin(true);
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#10b981]" />

      {/* Card */}
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 w-[380px] text-white z-10">
        <h2 className="text-2xl font-semibold text-center mb-2">
          {isLogin ? "Welcome Back!" : "Create Account"}
        </h2>

        <p className="text-center text-sm text-gray-300 mb-6">
          {isLogin ? "Sign in to your account" : "Register to continue"}
        </p>

        {/* Toggle */}
        <div className="flex bg-white/10 rounded-lg p-1 mb-4">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded ${
              isLogin ? "bg-white text-black" : ""
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded ${
              !isLogin ? "bg-white text-black" : ""
            }`}
          >
            Signup
          </button>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 bg-white/20 border border-white/20 rounded px-3 py-2 mb-3">
          <Mail size={18} />
          <input
            placeholder="Email"
            className="bg-transparent outline-none w-full"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Password */}
        <div className="flex items-center gap-2 bg-white/20 border border-white/20 rounded px-3 py-2 mb-3">
          <Lock size={18} />
          <input
            type="password"
            placeholder="Password"
            className="bg-transparent outline-none w-full"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {/* Signup Fields */}
        {!isLogin && (
          <>
            <div className="flex items-center gap-2 bg-white/20 border border-white/20 rounded px-3 py-2 mb-3">
              <User size={18} />
              <input
                placeholder="Name"
                className="bg-transparent outline-none w-full"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {role === "student" && (
              <>
                <input
                  placeholder="Roll Number"
                  className="w-full mb-2 p-2 rounded bg-white/20 border border-white/20"
                  onChange={(e) =>
                    setForm({ ...form, rollNumber: e.target.value })
                  }
                />
                <input
                  placeholder="Phone"
                  className="w-full border p-2 rounded"
                 onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  />
                <input
                  placeholder="Class"
                  className="w-full mb-2 p-2 rounded bg-white/20 border border-white/20"
                  onChange={(e) =>
                    setForm({ ...form, className: e.target.value })
                  }
                />
                <input
                  placeholder="Section"
                  className="w-full mb-2 p-2 rounded bg-white/20 border border-white/20"
                  onChange={(e) =>
                    setForm({ ...form, section: e.target.value })
                  }
                />
                <input
                  placeholder="MAC Address"
                  className="w-full mb-2 p-2 rounded bg-white/20 border border-white/20"
                  onChange={(e) =>
                    setForm({ ...form, macAddress: e.target.value })
                  }
                />
              </>
            )}
          </>
        )}

        {/* Role Cards */}
        <div className="flex gap-3 mb-4">
          <div
            onClick={() => setRole("teacher")}
            className={`flex-1 p-3 rounded-lg text-center cursor-pointer border ${
              role === "teacher" ? "bg-green-500 text-white" : "bg-white/10"
            }`}
          >
            <User className="mx-auto mb-1" size={18} />
            Teacher
          </div>

          <div
            onClick={() => setRole("student")}
            className={`flex-1 p-3 rounded-lg text-center cursor-pointer border ${
              role === "student" ? "bg-purple-500 text-white" : "bg-white/10"
            }`}
          >
            <GraduationCap className="mx-auto mb-1" size={18} />
            Student
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] transition"
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
        </button>
      </div>
    </div>
  );
}
