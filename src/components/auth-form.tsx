"use client"

import { useEffect, useState, type SyntheticEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { GraduationCap, Info, Loader2, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, selectClass } from "@/components/common"
import { Logo } from "@/components/app-shell"
import { api, errorMessage } from "@/lib/client"
import { cn } from "@/lib/utils"

type Mode = "login" | "register"
type Role = "teacher" | "student"

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  teacherId: "",
  rollNumber: "",
  classId: "",
  macAddress: "",
  deviceName: "",
}

// Demo accounts created by `npm run db:seed`; shown only when NEXT_PUBLIC_SHOW_DEMO=true.
const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO === "true"
const DEMO = {
  teacher: { email: "teacher@demo.attendify.app", password: "demo1234" },
  student: { email: "student@demo.attendify.app", password: "demo1234" },
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [role, setRole] = useState<Role>("teacher")
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ id: string; label: string }[] | null>(null)

  const isRegister = mode === "register"
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  useEffect(() => {
    if (isRegister && role === "student" && classes === null) {
      api<{ data: { id: string; label: string }[] }>("/api/classes")
        .then((r) => setClasses(r.data))
        .catch(() => setClasses([]))
    }
  }, [isRegister, role, classes])

  const login = async (email: string, password: string, as: Role) => {
    const res = await api<{ redirectTo: string }>("/api/auth/login", {
      method: "POST",
      body: { email, password, role: as },
    })
    router.replace(res.redirectTo)
    router.refresh()
  }

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        const body =
          role === "teacher"
            ? { role, name: form.name, email: form.email, phone: form.phone, password: form.password, teacherId: form.teacherId }
            : {
                role,
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                rollNumber: form.rollNumber,
                classId: form.classId,
                macAddress: form.macAddress,
                deviceName: form.deviceName || undefined,
              }
        const res = await api<{ redirectTo: string }>("/api/auth/register", { method: "POST", body })
        toast.success("Account created")
        router.replace(res.redirectTo)
        router.refresh()
      } else {
        await login(form.email, form.password, role)
      }
    } catch (err) {
      toast.error(errorMessage(err))
      setLoading(false)
    }
  }

  const demoLogin = async (as: Role) => {
    setLoading(true)
    try {
      await login(DEMO[as].email, DEMO[as].password, as)
    } catch (err) {
      toast.error(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-800 to-violet-700 p-10 text-white lg:flex">
        <Logo className="text-white [&>span]:bg-white/15" />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">Attendance that marks itself.</h2>
          <p className="mt-4 text-white/75">
            An ESP32 in the classroom detects students&apos; phones on WiFi and records attendance for the lecture in
            progress — no roll calls, no proxies by paper.
          </p>
        </div>
        <p className="text-sm text-white/50">Next.js · PostgreSQL · Prisma · ESP32</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "New to Attendify? "}
            <Link href={isRegister ? "/login" : "/register"} className="font-medium text-primary hover:underline">
              {isRegister ? "Log in" : "Create an account"}
            </Link>
          </p>

          {/* Role switch */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1" role="tablist">
            {(
              [
                ["teacher", "Teacher", Presentation],
                ["student", "Student", GraduationCap],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={role === value}
                onClick={() => setRole(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition",
                  role === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            {isRegister && (
              <Field label="Full name">
                <Input required value={form.name} onChange={set("name")} placeholder="Aditi Sharma" autoComplete="name" />
              </Field>
            )}
            <Field label="Email">
              <Input
                required
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@school.edu"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <Input
                required
                type="password"
                minLength={isRegister ? 6 : undefined}
                value={form.password}
                onChange={set("password")}
                placeholder={isRegister ? "At least 6 characters" : "••••••••"}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </Field>

            {isRegister && (
              <>
                <Field label="Phone">
                  <Input required type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                </Field>

                {role === "teacher" ? (
                  <Field label="Teacher ID">
                    <Input required value={form.teacherId} onChange={set("teacherId")} placeholder="T-1024" />
                  </Field>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Class">
                        <select required value={form.classId} onChange={set("classId")} className={selectClass}>
                          <option value="">{classes === null ? "Loading…" : "Select"}</option>
                          {classes?.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Roll number">
                        <Input required value={form.rollNumber} onChange={set("rollNumber")} placeholder="21" />
                      </Field>
                    </div>
                    {classes?.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No classes yet — your teacher creates them when scheduling lectures.
                      </p>
                    )}
                    <Field label="Phone's WiFi MAC address">
                      <Input
                        required
                        value={form.macAddress}
                        onChange={set("macAddress")}
                        placeholder="AA:BB:CC:DD:EE:FF"
                        className="font-mono"
                      />
                    </Field>
                    <p className="-mt-2 flex gap-1.5 text-xs text-muted-foreground">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      Phones use a private MAC per network. Connect to the classroom WiFi once, then copy the address
                      from that network&apos;s details (Android: &ldquo;Randomized MAC&rdquo;, iPhone: &ldquo;Private Wi-Fi
                      Address&rdquo;).
                    </p>
                    <Field label="Device name (optional)">
                      <Input value={form.deviceName} onChange={set("deviceName")} placeholder="Pixel 8" />
                    </Field>
                  </>
                )}
              </>
            )}

            <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
              {loading && <Loader2 className="animate-spin" />}
              {isRegister ? "Create account" : `Log in as ${role}`}
            </Button>
          </form>

          {SHOW_DEMO && !isRegister && (
            <div className="mt-6 border-t pt-5">
              <p className="mb-2 text-center text-xs text-muted-foreground">Just looking around? Try a demo account</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={loading} onClick={() => demoLogin("teacher")}>
                  Demo teacher
                </Button>
                <Button variant="outline" disabled={loading} onClick={() => demoLogin("student")}>
                  Demo student
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
