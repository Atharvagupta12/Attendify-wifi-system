import Link from "next/link"
import { BarChart3, Cpu, ShieldCheck, Smartphone, Wifi, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/app-shell"
import { getCurrentUser } from "@/lib/user"

const FEATURES = [
  { icon: Wifi, title: "Hands-free check-in", text: "Students are marked present when their registered phone is on the classroom WiFi." },
  { icon: Zap, title: "Live roster", text: "Teachers watch check-ins arrive in real time and can override any entry." },
  { icon: BarChart3, title: "Reports that add up", text: "Per-subject attendance, 75% alerts, CSV export and emailed reports." },
  { icon: ShieldCheck, title: "Secure by design", text: "httpOnly JWT sessions, per-route authorization and a keyed device API." },
]

const STEPS = [
  { icon: Smartphone, title: "Register your phone", text: "Students sign up once with their phone's WiFi MAC address." },
  { icon: Cpu, title: "ESP32 scans the room", text: "A $5 board hosts the classroom WiFi and reports connected devices." },
  { icon: BarChart3, title: "Attendance is recorded", text: "The server matches devices to the lecture in progress and marks attendance." },
]

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Logo />
        <div className="flex gap-2">
          {user ? (
            <Button asChild>
              <Link href={`/${user.role}/dashboard`}>Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-20 text-center md:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" /> IoT + full-stack attendance system
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
          Attendance that <span className="text-primary">marks itself.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          No roll calls, no paper sheets. An ESP32 detects students&apos; phones on the classroom WiFi and records attendance
          for the lecture in progress.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-10 px-5">
            <Link href={user ? `/${user.role}/dashboard` : "/register"}>{user ? "Open dashboard" : "Create an account"}</Link>
          </Button>
          {!user && (
            <Button asChild size="lg" variant="outline" className="h-10 px-5">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="border-y bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Attendify · Built with Next.js, PostgreSQL, Prisma and ESP32
      </footer>
    </div>
  )
}
