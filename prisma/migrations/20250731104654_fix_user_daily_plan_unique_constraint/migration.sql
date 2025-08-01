/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentId,date]` on the table `UserDailyPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserDailyPlan_userId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyPlan_enrollmentId_date_key" ON "UserDailyPlan"("enrollmentId", "date");
