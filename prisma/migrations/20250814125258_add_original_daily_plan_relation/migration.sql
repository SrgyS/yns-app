/*
  Warnings:

  - Added the required column `originalDailyPlanId` to the `UserWorkoutCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."UserWorkoutCompletion" ADD COLUMN     "originalDailyPlanId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_originalDailyPlanId_fkey" FOREIGN KEY ("originalDailyPlanId") REFERENCES "public"."DailyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
