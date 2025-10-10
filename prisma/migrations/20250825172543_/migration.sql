/*
  Warnings:

  - You are about to drop the column `dayNumber` on the `DailyPlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId,weekNumber,dayNumberInWeek]` on the table `DailyPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dayNumberInWeek` to the `DailyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DailyPlan" DROP COLUMN "dayNumber",
ADD COLUMN     "dayNumberInWeek" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_courseId_weekNumber_dayNumberInWeek_key" ON "public"."DailyPlan"("courseId", "weekNumber", "dayNumberInWeek");
