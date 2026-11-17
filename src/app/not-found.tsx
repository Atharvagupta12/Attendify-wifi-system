import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand"
import { RadarPulse } from "@/components/radar"

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <Link href="/" className="absolute top-6 left-6">
        <Logo />
      </Link>
      <RadarPulse size={220} className="relative opacity-80" />
      <p className="relative mt-8 font-mono text-sm text-primary">404 · signal lost</p>
      <h1 className="relative mt-2 text-3xl font-semibold tracking-tight md:text-4xl">This page isn&apos;t on the network</h1>
      <p className="relative mt-3 max-w-md text-muted-foreground">
        We scanned everywhere but couldn&apos;t find it. It may have moved, or the link is mistyped.
      </p>
      <Button asChild size="lg" className="relative mt-8">
        <Link href="/">
          <ArrowLeft /> Back to home
        </Link>
      </Button>
    </div>
  )
}
