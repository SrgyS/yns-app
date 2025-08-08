/*
  Warnings:

  - Added the required column `dayOfWeek` to the `UserDailyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalDailyPlanId` to the `UserDailyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekNumber` to the `UserDailyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserDailyPlan" ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL,
ADD COLUMN     "originalDailyPlanId" TEXT NOT NULL,
ADD COLUMN     "weekNumber" INTEGER NOT NULL;
