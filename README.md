# Attendify: WiFi-based smart attendance

Attendify takes classroom attendance automatically. An **ESP32** in the classroom hosts a WiFi network and reports which phones are connected. The server matches those phones to registered students and to the lecture in progress, then marks them present. There are no roll calls and no paper sheets.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL · Prisma · Tailwind CSS v4 · Zod · JWT · Nodemailer · ESP32 (Arduino C++)

---

## Features

**For teachers**
- Weekly timetable with conflict detection. A class can't have two lectures at once, and neither can a teacher.
- Live dashboard. Today's lectures, check-ins arriving in real time, and 30-day stats.
- **Attendance sessions.** Open the WiFi attendance window on demand, for extra or rescheduled lectures, with a countdown.
- Full roster for every lecture, with **manual override** (phone died, or proxy suspected) and an audit trail showing WiFi or teacher as the source.
- CSV export and an **emailed report** (HTML table plus CSV attachment).

**For students**
- Attendance percentage, a per-subject breakdown, and a warning below 75%. The warning says how many consecutive lectures recover the percentage.
- "Live now" banner that confirms the check-in once the phone is detected.
- Upcoming lectures, attendance history including absences, and self-service device (MAC) updates.

**Hardware**
- [ESP32 firmware](firmware/) runs in AP+STA mode: it hosts the classroom WiFi and reports connected MACs over HTTPS.
- A [simulator](scripts/simulate-esp32.mjs) sends the same request, so the whole flow can be demoed without a board.

## Architecture

```
 Students' phones ──WiFi──▶ ESP32 (SoftAP)
                              │  POST /api/wifi/mark-attendance
                              │  x-device-key: ••••   { macAddresses: [...] }
                              ▼
 Browser ──httpOnly JWT──▶ Next.js route handlers ──Prisma──▶ PostgreSQL
 (teacher / student UI)      (auth + zod validation)
```

### Key design decisions

| Decision | Why |
|---|---|
| **Absences are derived, not stored.** Only `Present` rows (and manual overrides) are written. For a finished lecture, a student with no row is Absent. | Absent counts are always correct, and no cron job is needed to write absences on a serverless host. |
| **Schedule times are wall-clock `"HH:mm"` strings in `APP_TIMEZONE`.** | Vercel runs in UTC. A 10:00 IST lecture must stay 10:00 whatever timezone the server runs in. `"HH:mm"` strings also compare correctly as text, which makes overlap checks one indexed query. |
| **Lecture occurrence = (schedule, date).** It comes from the weekly slot, or from a teacher-started session. | One model covers both regular and ad-hoc lectures. |
| **Session in an httpOnly cookie; the server layout verifies it.** | Page scripts can't read the token, so XSS can't steal it. Protected pages never render for unauthenticated users. |
| **Every API route derives the user from the token**, never from query parameters. Writes filter by owner (`deleteMany({ where: { id, teacherId } })`). | Prevents IDOR: one teacher can't read or modify another teacher's data. |
| **Device endpoint uses a shared key with a constant-time comparison**, a batched lookup, and `createMany({ skipDuplicates })`. | Repeated or concurrent scans from several boards are idempotent and take a fixed number of queries. |

### Data model

```
Teacher ─< Schedule >─ Class ─< Student ─ Device (unique MAC)
              │  └─ Subject
              ├─< Attendance (student, schedule, date) unique · status · source WIFI|MANUAL
              └─< AttendanceSession (expiresAt, isActive)
```

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Teacher or student signup (zod discriminated union) |
| POST | `/api/auth/login` · `/logout` | public | Set or clear the session cookie |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/classes` | public | Classes for the signup form |
| GET | `/api/teacher/overview` | teacher | Dashboard data |
| GET/POST | `/api/teacher/schedules` | teacher | List or create weekly lectures |
| DELETE | `/api/teacher/schedules/:id` | teacher (owner) | Delete a lecture |
| POST | `/api/teacher/sessions` | teacher (owner) | Start an attendance session |
| DELETE | `/api/teacher/sessions/:id` | teacher (owner) | Stop a session |
| GET | `/api/teacher/attendance?days=30` | teacher | Lecture history with counts |
| GET/PATCH | `/api/teacher/attendance/roster` | teacher (owner) | Roster for one lecture, or a manual override |
| POST | `/api/teacher/attendance/email` | teacher (owner) | Email the report |
| GET | `/api/student/overview` | student | Stats, subjects, history, upcoming, device |
| PUT | `/api/student/device` | student | Change the registered phone |
| POST | `/api/wifi/mark-attendance` | device key | ESP32 ingestion |

## Getting started

```bash
git clone https://github.com/Atharvagupta12/Attendify-wifi-system.git
cd Attendify-wifi-system
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, DEVICE_API_KEY
npm run db:migrate          # apply migrations
npm run db:seed             # optional: demo teacher/student + 3 weeks of history
npm run dev                 # http://localhost:3000
```

The demo accounts (after seeding) are `teacher@demo.attendify.app` and `student@demo.attendify.app`, both with password `demo1234`. Set `NEXT_PUBLIC_SHOW_DEMO=true` to show one-click demo buttons on the login page.

### Try the WiFi flow without hardware

While a lecture is in progress, or after clicking **Start session** on the teacher dashboard:

```bash
npm run simulate                        # every registered phone "joins" the classroom WiFi
npm run simulate -- 02:DE:00:00:00:01   # a specific phone
npm run simulate -- --watch             # repeat every 30 s like the real board
```

The teacher dashboard and roster update live.

### Scripts

| Script | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` | Static checks |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Load demo data |
| `npm run simulate` | Fake ESP32 scan |

## Known limitations

- **MAC addresses can be spoofed.** WiFi presence shows that a device is in the room, not who is holding it. Manual teacher override is the safeguard. A stronger design would add a signed token issued by the board's captive portal.
- **Private MAC addresses.** Modern phones use a random MAC for each network, so students must register the address shown for the classroom network.
- **ESP32 SoftAP holds at most 10 phones.** Larger rooms need several boards, or probe-request sniffing. See [firmware/README.md](firmware/README.md).
