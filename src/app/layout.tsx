import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { themeScript } from "@/components/theme"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Attendify · Attendance that marks itself", template: "%s · Attendify" },
  description:
    "WiFi-based smart attendance. An ESP32 in the classroom detects students' phones and marks them present for the lecture in progress.",
  openGraph: {
    title: "Attendify · Attendance that marks itself",
    description: "WiFi + ESP32 smart attendance with live dashboards for teachers and students.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1020" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            className: "!bg-popover !text-popover-foreground !border !border-border !shadow-float !rounded-xl !text-sm",
            success: { iconTheme: { primary: "var(--success)", secondary: "white" } },
            error: { iconTheme: { primary: "var(--danger)", secondary: "white" } },
          }}
        />
        {children}
      </body>
    </html>
  )
}
