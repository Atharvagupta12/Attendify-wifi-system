import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  Cpu,
  FileSpreadsheet,
  Fingerprint,
  Radio,
  ShieldCheck,
  Smartphone,
  UserCog,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GITHUB_URL, GitHubIcon, Logo } from "@/components/brand"
import { ThemeToggle } from "@/components/theme"
import { DashboardPreview } from "@/components/dashboard-preview"
import { RadarPulse, LiveDot } from "@/components/radar"
import { getCurrentUser } from "@/lib/user"

const STATS = [
  ["0", "roll calls per lecture"],
  ["30s", "ESP32 scan interval"],
  ["< 1 min", "to mark a full class"],
  ["100%", "audit trail on every entry"],
]

const STEPS = [
  {
    icon: Smartphone,
    title: "Register once",
    text: "Students sign up with their phone's WiFi address. That's the only setup they ever do.",
  },
  {
    icon: Cpu,
    title: "ESP32 listens",
    text: "A $5 board hosts the classroom network and reports which phones are connected every 30 seconds.",
  },
  {
    icon: BarChart3,
    title: "Attendance lands",
    text: "The server matches phones to the lecture in progress and marks students present, live.",
  },
]

const ROLES = [
  {
    title: "For teachers",
    points: [
      "Live roster that fills itself during the lecture",
      "Start a session on demand for extra classes",
      "Override any entry with a full audit trail",
      "CSV export and one-click emailed reports",
    ],
  },
  {
    title: "For students",
    points: [
      "Attendance ring with a 75% safety marker",
      "Per-subject breakdown and a 6-week heatmap",
      "“You're checked in” confirmation in class",
      "Update your registered phone any time",
    ],
  },
]

export default async function Home() {
  const user = await getCurrentUser()
  const dashboard = user ? `/${user.role}/dashboard` : null

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:border-border/60">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/">
            <Logo />
          </Link>
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#tech" className="transition-colors hover:text-foreground">Under the hood</a>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {dashboard ? (
              <Button asChild>
                <Link href={dashboard}>Dashboard <ArrowRight /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="pointer-events-none absolute top-[-10%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_28%,transparent),transparent)] blur-2xl" />
        <div className="pointer-events-none absolute top-40 right-[-10%] h-80 w-80 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand-2)_25%,transparent),transparent)] blur-2xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-8 text-center md:px-8 md:pt-24">
          <a
            href="#how"
            className="inline-flex animate-rise items-center gap-2 rounded-full border bg-card/70 py-1 pr-3 pl-1 text-xs text-muted-foreground shadow-soft backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-success/12 px-2 py-0.5 font-medium text-success">
              <LiveDot /> IoT
            </span>
            ESP32 + Next.js + PostgreSQL
            <ArrowRight className="size-3" />
          </a>

          <h1 className="mx-auto mt-7 max-w-4xl animate-rise text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.035em] [animation-delay:80ms] sm:text-6xl md:text-7xl">
            Attendance that <br className="hidden sm:block" />
            <span className="text-gradient">marks itself.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl animate-rise text-base text-muted-foreground [animation-delay:160ms] md:text-lg">
            Students walk in, their phones join the classroom WiFi, and they&apos;re marked present. No roll calls, no
            paper sheets, no lost minutes.
          </p>

          <div className="mt-9 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <Button asChild size="lg">
              <Link href={dashboard ?? "/login"}>
                {dashboard ? "Open dashboard" : "Try the live demo"} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitHubIcon className="size-4" /> View source
              </a>
            </Button>
          </div>
        </div>

        {/* Product shot */}
        <div className="relative mx-auto max-w-5xl px-4 pb-20 md:px-8">
          <div className="relative animate-rise [animation-delay:320ms] [perspective:1800px]">
            <div className="absolute -inset-x-6 -inset-y-4 rounded-[28px] bg-brand-gradient opacity-[0.12] blur-2xl" />
            <DashboardPreview className="relative md:[transform:rotateX(6deg)]" />

            {/* floating device card */}
            <div className="absolute -bottom-6 -left-2 hidden animate-float items-center gap-3 rounded-2xl border bg-card/90 p-3 pr-5 shadow-float backdrop-blur md:flex">
              <RadarPulse size={56} showCore={false} dots={5} />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">ESP32 · Room 101</p>
                <p className="text-sm font-semibold">Scanning every 30s</p>
              </div>
            </div>
            <div className="absolute -top-5 -right-3 hidden animate-float items-center gap-2 rounded-xl border bg-card/90 px-3 py-2 text-sm shadow-float backdrop-blur [animation-delay:-3s] md:flex">
              <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-3.5" />
              </span>
              Diya checked in · <span className="text-muted-foreground">now</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats strip ---------- */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-border px-4 md:grid-cols-4 md:divide-x md:px-8">
          {STATS.map(([value, label]) => (
            <div key={label} className="px-4 py-8 text-center">
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-8">
        <SectionHeading eyebrow="How it works" title="From WiFi signal to attendance record" />
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {/* animated connector */}
          <svg className="absolute top-12 left-[16%] hidden h-2 w-[68%] md:block" preserveAspectRatio="none" aria-hidden>
            <line x1="0" y1="4" x2="100%" y2="4" stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 10" className="animate-dash" />
          </svg>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="relative text-center">
              <div className="relative mx-auto flex size-24 items-center justify-center rounded-3xl border bg-card shadow-soft">
                <div className="absolute inset-2 rounded-2xl bg-brand-gradient opacity-10" />
                <Icon className="relative size-9 text-primary" strokeWidth={1.6} />
                <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Features (bento) ---------- */}
      <section id="features" className="scroll-mt-20 border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-24 md:px-8">
          <SectionHeading eyebrow="Features" title="Everything a classroom needs, nothing it doesn't" />
          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <Bento className="md:col-span-4 md:row-span-2" icon={Radio} title="Live check-ins" text="Watch the roster fill itself in real time while the lecture runs. Every entry shows when, and whether WiFi or the teacher marked it.">
              <div className="mt-6 flex items-center justify-center rounded-xl border bg-muted/30 py-8">
                <RadarPulse size={200} dots={11} tone="success" />
              </div>
            </Bento>
            <Bento className="md:col-span-2" icon={BellRing} title="75% early warning" text="Students see exactly how many lectures in a row bring them back on track." />
            <Bento className="md:col-span-2" icon={UserCog} title="Teacher overrides" text="Phone died? Proxy suspected? One click, with an audit trail." />
            <Bento className="md:col-span-2" icon={FileSpreadsheet} title="Reports" text="CSV export and emailed HTML reports for every lecture." />
            <Bento className="md:col-span-2" icon={ShieldCheck} title="Secure by design" text="httpOnly sessions, per-route authorization, keyed device API." />
            <Bento className="md:col-span-2" icon={Fingerprint} title="Zero hardware for students" text="No cards or biometrics. The phone they already carry is enough." />
          </div>
        </div>
      </section>

      {/* ---------- Roles ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-24 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {ROLES.map((r, i) => (
            <div key={r.title} className={i === 0 ? "rounded-3xl p-8 ring-gradient shadow-soft" : "rounded-3xl border bg-card p-8 shadow-soft"}>
              <h3 className="text-xl font-semibold">{r.title}</h3>
              <ul className="mt-6 space-y-3.5">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Under the hood ---------- */}
      <section id="tech" className="scroll-mt-20 border-t bg-muted/20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:grid-cols-2 md:px-8">
          <div>
            <SectionHeading align="left" eyebrow="Under the hood" title="A tiny board, a typed API, a real database" />
            <ul className="mt-8 space-y-5 text-sm">
              {[
                ["Derived absences", "Only check-ins are stored. Absences are computed per lecture, so no cron job is needed."],
                ["Timezone-proof schedules", "Wall-clock times in the institution's timezone, even on UTC servers."],
                ["Idempotent ingestion", "Repeat or concurrent scans never double-mark, in a fixed number of queries."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-gradient" />
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="mt-0.5 text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Next.js 16", "React 19", "TypeScript", "PostgreSQL", "Prisma", "Tailwind v4", "Zod", "ESP32"].map((t) => (
                <span key={t} className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-[oklch(0.17_0.02_278)] font-mono text-[13px] text-slate-300 shadow-float">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-slate-400">
              <Wifi className="size-3.5 text-emerald-400" /> esp32 → POST /api/wifi/mark-attendance
            </div>
            <pre className="overflow-x-auto p-5 leading-relaxed">
              <span className="text-violet-300">x-device-key</span>: <span className="text-slate-500">••••••••</span>
              {"\n\n"}
              {"{\n"}
              {"  "}<span className="text-sky-300">&quot;deviceId&quot;</span>: <span className="text-emerald-300">&quot;room-101&quot;</span>,{"\n"}
              {"  "}<span className="text-sky-300">&quot;macAddresses&quot;</span>: [{"\n"}
              {"    "}<span className="text-emerald-300">&quot;02:DE:00:00:00:01&quot;</span>,{"\n"}
              {"    "}<span className="text-emerald-300">&quot;02:DE:00:00:00:02&quot;</span>{"\n"}
              {"  ]\n}"}
              {"\n\n"}
              <span className="text-slate-500">{"// 200 OK"}</span>
              {"\n{ "}
              <span className="text-sky-300">&quot;marked&quot;</span>: [<span className="text-emerald-300">&quot;Aarav&quot;</span>, <span className="text-emerald-300">&quot;Diya&quot;</span>],{" "}
              <span className="text-sky-300">&quot;alreadyMarked&quot;</span>: <span className="text-amber-300">0</span>
              {" }"}
            </pre>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-24 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[oklch(0.2_0.08_278)] px-6 py-16 text-center text-white shadow-float md:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,oklch(0.55_0.22_278/0.6),transparent)]" />
          <div className="absolute -right-20 -bottom-24 opacity-60">
            <RadarPulse size={320} showCore={false} />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">See it mark a class in under a minute.</h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              Log in with a demo teacher or student account. No setup and no hardware needed.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-[oklch(0.25_0.1_278)] shadow-none hover:bg-white/90">
                <Link href={dashboard ?? "/login"}>
                  {dashboard ? "Open dashboard" : "Try the demo"} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/register">Create an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-8">
          <Logo />
          <p>WiFi-based smart attendance · Built with Next.js, PostgreSQL and ESP32</p>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-colors hover:text-foreground">
            <GitHubIcon className="size-4" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

function SectionHeading({ eyebrow, title, align = "center" }: { eyebrow: string; title: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
    </div>
  )
}

function Bento({
  icon: Icon,
  title,
  text,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`group rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float ${className ?? ""}`}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
      {children}
    </div>
  )
}
