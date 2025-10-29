/*
  Warnings:

  - You are about to drop the column `originalDailyPlanId` on the `UserWorkoutCompletion` table. All the data in the column will be lost.
  - You are about to drop the column `userDailyPlanId` on the `UserWorkoutCompletion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,enrollmentId,contentType,stepIndex]` on the table `UserWorkoutCompletion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `warmupStepIndex` to the `UserDailyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentType` to the `UserWorkoutCompletion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stepIndex` to the `UserWorkoutCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DailyContentType" AS ENUM ('WARMUP', 'MAIN');

-- DropForeignKey
ALTER TABLE "public"."UserWorkoutCompletion" DROP CONSTRAINT "UserWorkoutCompletion_userDailyPlanId_fkey";

-- DropIndex
DROP INDEX "public"."UserWorkoutCompletion_userDailyPlanId_idx";

-- DropIndex
DROP INDEX "public"."UserWorkoutCompletion_userId_workoutId_enrollmentId_workout_key";

-- AlterTable
ALTER TABLE "UserDailyPlan" ADD COLUMN     "mainWorkoutStepIndex" INTEGER,
ADD COLUMN     "warmupStepIndex" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserWorkoutCompletion" DROP COLUMN "originalDailyPlanId",
DROP COLUMN "userDailyPlanId",
ADD COLUMN     "contentType" "DailyContentType" NOT NULL,
ADD COLUMN     "stepIndex" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkoutCompletion_userId_enrollmentId_contentType_stepI_key" ON "UserWorkoutCompletion"("userId", "enrollmentId", "contentType", "stepIndex");
