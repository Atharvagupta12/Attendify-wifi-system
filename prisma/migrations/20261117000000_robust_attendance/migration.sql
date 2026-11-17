-- Robust attendance model:
--  * Schedule times become wall-clock "HH:mm" strings (timezone-independent)
--  * Attendance.date becomes a pure DATE
--  * Attendance gets a `source` (WIFI | MANUAL) for teacher overrides
--  * Cascading deletes, uniqueness on Class and (class, roll number), query indexes

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_scheduleId_fkey";
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";
ALTER TABLE "Device" DROP CONSTRAINT "Device_studentId_fkey";
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_teacherId_fkey";

-- Attendance: DATE column (existing values are stored at UTC midnight, so a direct cast keeps the day)
ALTER TABLE "Attendance" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WIFI',
ALTER COLUMN "date" SET DATA TYPE DATE USING "date"::date;

-- AttendanceSession: record when a session was stopped manually
ALTER TABLE "AttendanceSession" ADD COLUMN "endedAt" TIMESTAMP(3);

-- Schedule: keep only the wall-clock time the teacher entered
ALTER TABLE "Schedule" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "startTime" SET DATA TYPE TEXT USING to_char("startTime", 'HH24:MI'),
ALTER COLUMN "endTime" SET DATA TYPE TEXT USING to_char("endTime", 'HH24:MI');

-- Backfill: a schedule existed at least since its earliest attendance record,
-- so historical occurrences stay visible in reports.
UPDATE "Schedule" s
SET "createdAt" = sub.first_date
FROM (SELECT "scheduleId", MIN("date")::timestamp AS first_date FROM "Attendance" GROUP BY "scheduleId") sub
WHERE sub."scheduleId" = s."id" AND sub.first_date < s."createdAt";

-- Normalize stored MAC addresses to upper case (the API now normalizes input the same way)
UPDATE "Device" SET "macAddress" = UPPER("macAddress");

-- CreateIndex
CREATE INDEX "Attendance_scheduleId_date_idx" ON "Attendance"("scheduleId", "date");
CREATE INDEX "AttendanceSession_isActive_expiresAt_idx" ON "AttendanceSession"("isActive", "expiresAt");
CREATE UNIQUE INDEX "Class_className_section_key" ON "Class"("className", "section");
CREATE INDEX "Schedule_classId_dayOfWeek_idx" ON "Schedule"("classId", "dayOfWeek");
CREATE INDEX "Schedule_teacherId_idx" ON "Schedule"("teacherId");
CREATE UNIQUE INDEX "Student_classId_rollNumber_key" ON "Student"("classId", "rollNumber");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
