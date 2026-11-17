"use client"

import { useEffect, useState, type SyntheticEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft, ArrowRight, GraduationCap, Info, Loader2, Presentation, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, selectClass } from "@/components/common"
import { Logo } from "@/components/brand"
import { ThemeToggle } from "@/components/theme"
import { DashboardPreview } from "@/components/dashboard-preview"
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
  const [loading, setLoading] = useState<false | "form" | Role>(false)
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
    toast.success("Welcome back!")
    router.replace(res.redirectTo)
    router.refresh()
  }

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setLoading("form")
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
        toast.success("Account created. Welcome to Attendify!")
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
    setLoading(as)
    try {
      await login(DEMO[as].email, DEMO[as].password, as)
    } catch (err) {
      toast.error(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.1fr]">
      {/* ---------- Form side ---------- */}
      <div className="relative flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Home
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Logo className="mb-8" />
          <h1 className="animate-rise text-3xl font-semibold tracking-tight">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 animate-rise text-sm text-muted-foreground [animation-delay:60ms]">
            {isRegister ? "Set up takes less than a minute." : "Log in to see today's attendance."}
          </p>

          {/* Demo accounts */}
          {SHOW_DEMO && !isRegister && (
            <div className="mt-8 animate-rise [animation-delay:120ms]">
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["teacher", "Demo teacher", "Live dashboard", Presentation],
                    ["student", "Demo student", "Attendance stats", GraduationCap],
                  ] as const
                ).map(([as, title, sub, Icon]) => (
                  <button
                    key={as}
                    type="button"
                    disabled={!!loading}
                    onClick={() => demoLogin(as)}
                    className="group relative flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-float disabled:opacity-60"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {loading === as ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block text-xs text-muted-foreground">{sub}</span>
                    </span>
                    <ArrowRight className="absolute top-4 right-4 size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or log in with email <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          {/* Role switch */}
          <div
            className={cn("relative grid animate-rise grid-cols-2 rounded-xl bg-muted p-1 [animation-delay:160ms]", !(SHOW_DEMO && !isRegister) && "mt-8")}
            role="tablist"
          >
            <span
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-card shadow-soft ring-1 ring-border transition-transform duration-300 ease-out",
                role === "student" && "translate-x-full",
              )}
            />
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
                  "relative z-10 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                  role === value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 flex animate-rise flex-col gap-4 [animation-delay:200ms]">
            {isRegister && (
              <Field label="Full name">
                <Input required value={form.name} onChange={set("name")} placeholder="Aditi Sharma" autoComplete="name" />
              </Field>
            )}
            <Field label="Email">
              <Input required type="email" value={form.email} onChange={set("email")} placeholder="you@school.edu" autoComplete="email" />
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
                        <select required value={form.classId} onChange={set("classId")} className={cn(selectClass, "h-10")}>
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
                      <p className="-mt-2 text-xs text-muted-foreground">
                        No classes yet. Your teacher creates them when scheduling lectures.
                      </p>
                    )}
                    <Field label="Phone's WiFi MAC address">
                      <Input required value={form.macAddress} onChange={set("macAddress")} placeholder="AA:BB:CC:DD:EE:FF" className="font-mono" />
                    </Field>
                    <div className="-mt-1 flex gap-2.5 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>
                        Phones use a private address for each network. Join the classroom WiFi once, then copy it from that
                        network&apos;s details (<em>Randomized MAC</em> on Android, <em>Private Wi-Fi Address</em> on iPhone).
                      </span>
                    </div>
                    <Field label="Device name (optional)">
                      <Input value={form.deviceName} onChange={set("deviceName")} placeholder="Pixel 8" />
                    </Field>
                  </>
                )}
              </>
            )}

            <Button type="submit" size="lg" disabled={!!loading} className="mt-2 w-full">
              {loading === "form" && <Loader2 className="animate-spin" />}
              {isRegister ? "Create account" : `Log in as ${role}`}
              {loading !== "form" && <ArrowRight />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "New to Attendify? "}
            <Link href={isRegister ? "/login" : "/register"} className="font-medium text-primary hover:underline">
              {isRegister ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>

      {/* ---------- Showcase side ---------- */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.17_0.04_278)] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_10%,oklch(0.5_0.22_278/0.55),transparent),radial-gradient(50%_50%_at_10%_90%,oklch(0.55_0.2_305/0.35),transparent)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_80%)]" />

        <div className="relative flex h-full flex-col justify-center px-12 xl:px-20">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <Sparkles className="size-3.5" /> Live, hands-free attendance
          </span>
          <h2 className="mt-6 max-w-md text-4xl leading-tight font-semibold tracking-tight text-white">
            Your class marks itself present while you teach.
          </h2>
          <p className="mt-4 max-w-md text-white/65">
            Phones join the classroom WiFi, the ESP32 reports them, and the roster fills in live.
          </p>

          <div className="relative mt-12 max-w-xl">
            <div className="absolute -inset-4 rounded-3xl bg-white/5 blur-xl" />
            <div className="dark relative animate-float [animation-duration:8s]">
              <DashboardPreview compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
