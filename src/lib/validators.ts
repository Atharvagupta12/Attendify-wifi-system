import { z } from "zod"
import { DAYS } from "./time"

/**
 * Accepts AA:BB:CC:DD:EE:FF, aa-bb-cc-dd-ee-ff or aabbccddeeff.
 * Returns the canonical upper-case colon form, or null if invalid.
 */
export function normalizeMac(input: string): string | null {
  const hex = input.trim().replace(/[:\-.\s]/g, "").toUpperCase()
  if (!/^[0-9A-F]{12}$/.test(hex)) return null
  return hex.match(/.{2}/g)!.join(":")
}

const mac = z
  .string()
  .transform((v, ctx) => {
    const normalized = normalizeMac(v)
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF" })
      return z.NEVER
    }
    return normalized
  })

const name = z.string().trim().min(2, "Must be at least 2 characters").max(80)
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"))
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number")
const password = z.string().min(6, "Must be at least 6 characters").max(100)
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  role: z.enum(["teacher", "student"]),
})

export const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("teacher"),
    name,
    email,
    phone,
    password,
    teacherId: z.string().trim().min(1, "Teacher ID is required").max(40),
  }),
  z.object({
    role: z.literal("student"),
    name,
    email,
    phone,
    password,
    rollNumber: z.string().trim().min(1, "Roll number is required").max(20),
    classId: z.string().uuid("Select your class"),
    macAddress: mac,
    deviceName: z.string().trim().max(60).optional(),
  }),
])

export const scheduleSchema = z
  .object({
    className: z.string().trim().min(1, "Class is required").max(30),
    section: z.string().trim().min(1, "Section is required").max(10).toUpperCase(),
    subjectName: z.string().trim().min(2, "Subject is required").max(60),
    dayOfWeek: z.enum(DAYS),
    startTime: hhmm,
    endTime: hhmm,
  })
  .refine((s) => s.startTime < s.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })

export const startSessionSchema = z.object({
  scheduleId: z.string().uuid(),
  durationMinutes: z.number().int().min(5).max(240).default(60),
})

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")

export const overrideSchema = z.object({
  scheduleId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: dateKeySchema,
  status: z.enum(["Present", "Absent"]),
})

export const deviceSchema = z.object({
  macAddress: mac,
  deviceName: z.string().trim().max(60).optional(),
})

export const scanSchema = z.object({
  macAddresses: z.array(z.string()).min(1, "No MAC addresses provided").max(1000),
  deviceId: z.string().max(60).optional(),
})
