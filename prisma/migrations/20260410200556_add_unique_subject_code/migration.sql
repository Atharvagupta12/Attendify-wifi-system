/*
  Warnings:

  - A unique constraint covering the columns `[subjectCode]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Subject_subjectCode_key" ON "Subject"("subjectCode");
