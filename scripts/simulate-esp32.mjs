#!/usr/bin/env node
/**
 * Simulates the classroom ESP32: posts MAC addresses to the attendance endpoint,
 * exactly like the firmware does. Lets you demo the full flow without hardware.
 *
 *   npm run simulate                       # all registered devices (dev convenience)
 *   npm run simulate -- AA:BB:CC:DD:EE:FF  # specific MACs
 *   npm run simulate -- --watch            # repeat every 30 s like the real board
 *
 * Env: SIM_SERVER_URL (default http://localhost:3000), DEVICE_API_KEY, DATABASE_URL
 */
const args = process.argv.slice(2)
const watch = args.includes("--watch")
let macs = args.filter((a) => !a.startsWith("--"))

const server = process.env.SIM_SERVER_URL || "http://localhost:3000"
const key = process.env.DEVICE_API_KEY
if (!key) {
  console.error("DEVICE_API_KEY is not set (add it to .env)")
  process.exit(1)
}

if (macs.length === 0) {
  // No MACs given: pretend every registered phone is in the room.
  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()
  macs = (await prisma.device.findMany({ select: { macAddress: true } })).map((d) => d.macAddress)
  await prisma.$disconnect()
  console.log(`Using all ${macs.length} registered device(s)`)
}

async function scan() {
  const started = new Date().toLocaleTimeString()
  try {
    const res = await fetch(`${server}/api/wifi/mark-attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-device-key": key },
      body: JSON.stringify({ deviceId: "simulator", macAddresses: macs }),
    })
    console.log(`[${started}] HTTP ${res.status}`, await res.json())
  } catch (err) {
    console.error(`[${started}] request failed:`, err.message)
  }
}

await scan()
if (watch) setInterval(scan, 30_000)
