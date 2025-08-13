/*
  Warnings:

  - You are about to drop the column `mainWorkoutProgress` on the `UserDailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `mealPlanProgress` on the `UserDailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `warmupProgress` on the `UserDailyPlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,workoutId,enrollmentId,workoutType,userDailyPlanId]` on the table `UserWorkoutCompletion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userDailyPlanId` to the `UserWorkoutCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."UserWorkoutCompletion_userId_workoutId_enrollmentId_workout_key";

-- AlterTable
ALTER TABLE "public"."UserDailyPlan" DROP COLUMN "mainWorkoutProgress",
DROP COLUMN "mealPlanProgress",
DROP COLUMN "warmupProgress";

-- AlterTable
ALTER TABLE "public"."UserWorkoutCompletion" ADD COLUMN     "userDailyPlanId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "UserWorkoutCompletion_userDailyPlanId_idx" ON "public"."UserWorkoutCompletion"("userDailyPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkoutCompletion_userId_workoutId_enrollmentId_workout_key" ON "public"."UserWorkoutCompletion"("userId", "workoutId", "enrollmentId", "workoutType", "userDailyPlanId");

-- AddForeignKey
ALTER TABLE "public"."UserWorkoutCompletion" ADD CONSTRAINT "UserWorkoutCompletion_userDailyPlanId_fkey" FOREIGN KEY ("userDailyPlanId") REFERENCES "public"."UserDailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
