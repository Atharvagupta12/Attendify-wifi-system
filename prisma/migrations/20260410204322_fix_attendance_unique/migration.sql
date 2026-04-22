/*
  Warnings:

  - A unique constraint covering the columns `[studentId,scheduleId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_scheduleId_date_key" ON "Attendance"("studentId", "scheduleId", "date");
