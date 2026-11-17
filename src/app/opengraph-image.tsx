import { ImageResponse } from "next/og"

export const alt = "Attendify: attendance that marks itself"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Social preview card shown when the site link is shared (LinkedIn, WhatsApp, Slack…). */
export default function OpengraphImage() {
  const rings = [520, 400, 280]
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f1024 0%, #1c1a4a 55%, #2e1c56 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {rings.map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              right: 180 - s / 2,
              top: 315 - s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              border: "2px solid rgba(139, 124, 255, 0.35)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            right: 130,
            top: 265,
            width: 100,
            height: 100,
            borderRadius: 50,
            background: "linear-gradient(135deg, #5b4cf0, #a24ce0)",
            boxShadow: "0 0 80px rgba(120,100,255,0.7)",
          }}
        />
        {[
          [880, 150],
          [1010, 200],
          [1080, 400],
          [860, 470],
          [960, 540],
          [800, 300],
        ].map(([x, y]) => (
          <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: 16, height: 16, borderRadius: 8, background: "#34d399" }} />
        ))}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 600 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #5b4cf0, #a24ce0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 7, background: "white", marginTop: 14 }} />
            </div>
            Attendify
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 36, letterSpacing: -2 }}>
            Attendance that marks itself.
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", marginTop: 24, lineHeight: 1.4 }}>
            ESP32 detects phones on classroom WiFi. Live dashboards for teachers and students.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {["Next.js", "PostgreSQL", "Prisma", "ESP32"].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 20,
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
