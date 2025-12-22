/*
  Warnings:

  - You are about to drop the column `mainWorkoutId` on the `DailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `mainWorkoutId` on the `UserDailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `mainWorkoutStepIndex` on the `UserDailyPlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,enrollmentId,contentType,workoutId,stepIndex]` on the table `UserWorkoutCompletion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "DailyPlan" DROP CONSTRAINT "DailyPlan_mainWorkoutId_fkey";

-- DropForeignKey
ALTER TABLE "DailyPlan" DROP CONSTRAINT "DailyPlan_warmupId_fkey";

-- DropForeignKey
ALTER TABLE "UserDailyPlan" DROP CONSTRAINT "UserDailyPlan_mainWorkoutId_fkey";

-- DropIndex
DROP INDEX "UserWorkoutCompletion_userId_enrollmentId_contentType_stepI_key";

-- AlterTable
ALTER TABLE "DailyPlan" DROP COLUMN "mainWorkoutId",
ALTER COLUMN "warmupId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserDailyPlan" DROP COLUMN "mainWorkoutId",
DROP COLUMN "mainWorkoutStepIndex";

-- CreateTable
CREATE TABLE "DailyPlanMainWorkout" (
    "id" TEXT NOT NULL,
    "dailyPlanId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DailyPlanMainWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyMainWorkout" (
    "id" TEXT NOT NULL,
    "userDailyPlanId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stepIndex" INTEGER NOT NULL,

    CONSTRAINT "UserDailyMainWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyPlanMainWorkout_workoutId_idx" ON "DailyPlanMainWorkout"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlanMainWorkout_dailyPlanId_order_key" ON "DailyPlanMainWorkout"("dailyPlanId", "order");

-- CreateIndex
CREATE INDEX "UserDailyMainWorkout_userDailyPlanId_idx" ON "UserDailyMainWorkout"("userDailyPlanId");

-- CreateIndex
CREATE INDEX "UserDailyMainWorkout_workoutId_idx" ON "UserDailyMainWorkout"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyMainWorkout_userDailyPlanId_order_key" ON "UserDailyMainWorkout"("userDailyPlanId", "order");

-- CreateIndex
CREATE INDEX "UserWorkoutCompletion_workoutId_idx" ON "UserWorkoutCompletion"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkoutCompletion_userId_enrollmentId_contentType_worko_key" ON "UserWorkoutCompletion"("userId", "enrollmentId", "contentType", "workoutId", "stepIndex");

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_warmupId_fkey" FOREIGN KEY ("warmupId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlanMainWorkout" ADD CONSTRAINT "DailyPlanMainWorkout_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlanMainWorkout" ADD CONSTRAINT "DailyPlanMainWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyMainWorkout" ADD CONSTRAINT "UserDailyMainWorkout_userDailyPlanId_fkey" FOREIGN KEY ("userDailyPlanId") REFERENCES "UserDailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyMainWorkout" ADD CONSTRAINT "UserDailyMainWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
