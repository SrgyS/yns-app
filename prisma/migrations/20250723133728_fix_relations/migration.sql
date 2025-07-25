/*
  Warnings:

  - You are about to drop the column `contentType` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `landing` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescriptionId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `DailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescriptionId` on the `DailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `DailyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `mealPlanId` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `selectedWorkoutDays` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `FavoriteRecipe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FavoriteWorkout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MdxText` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklyContent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WeeklyContentDailyPlans` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Recipe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Workout` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `durationWeeks` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dayNumber` to the `DailyPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekNumber` to the `DailyPlan` table without a default value. This is not possible if the table is not empty.
  - Made the column `warmupId` on table `DailyPlan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mealPlanId` on table `DailyPlan` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `breakfastRecipeId` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dinnerRecipeId` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lunchRecipeId` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('LEGS', 'GLUTES', 'UPPER_BODY', 'BACK', 'PELVIC_FLOOR');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('course', 'subscription');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "UserAccessType" AS ENUM ('course');

-- CreateEnum
CREATE TYPE "UserAccessReason" AS ENUM ('paid', 'free', 'manual');

-- DropForeignKey
ALTER TABLE "DailyPlan" DROP CONSTRAINT "DailyPlan_mealPlanId_fkey";

-- DropForeignKey
ALTER TABLE "DailyPlan" DROP CONSTRAINT "DailyPlan_warmupId_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteRecipe" DROP CONSTRAINT "FavoriteRecipe_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteRecipe" DROP CONSTRAINT "FavoriteRecipe_userId_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteWorkout" DROP CONSTRAINT "FavoriteWorkout_userId_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteWorkout" DROP CONSTRAINT "FavoriteWorkout_workoutId_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_mealPlanId_fkey";

-- DropForeignKey
ALTER TABLE "_WeeklyContentDailyPlans" DROP CONSTRAINT "_WeeklyContentDailyPlans_A_fkey";

-- DropForeignKey
ALTER TABLE "_WeeklyContentDailyPlans" DROP CONSTRAINT "_WeeklyContentDailyPlans_B_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "contentType",
DROP COLUMN "landing",
DROP COLUMN "shortDescriptionId",
ADD COLUMN     "durationWeeks" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "DailyPlan" DROP COLUMN "shortDescription",
DROP COLUMN "shortDescriptionId",
DROP COLUMN "title",
ADD COLUMN     "dayNumber" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "weekNumber" INTEGER NOT NULL,
ALTER COLUMN "warmupId" SET NOT NULL,
ALTER COLUMN "mealPlanId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "breakfastRecipeId" TEXT NOT NULL,
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "dinnerRecipeId" TEXT NOT NULL,
ADD COLUMN     "lunchRecipeId" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "mealPlanId",
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "selectedWorkoutDays";

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "muscles" "MuscleGroup"[],
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "FavoriteRecipe";

-- DropTable
DROP TABLE "FavoriteWorkout";

-- DropTable
DROP TABLE "MdxText";

-- DropTable
DROP TABLE "WeeklyContent";

-- DropTable
DROP TABLE "_WeeklyContentDailyPlans";

-- DropEnum
DROP TYPE "MdxType";

-- CreateTable
CREATE TABLE "UserCourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "selectedWorkoutDays" "DayOfWeek"[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "hasFeedback" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserCourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayNumberInCourse" INTEGER NOT NULL,
    "isWorkoutDay" BOOLEAN NOT NULL,
    "warmupId" TEXT NOT NULL,
    "mainWorkoutId" TEXT,
    "mealPlanId" TEXT NOT NULL,
    "warmupProgress" "CompletionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "mainWorkoutProgress" "CompletionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "mealPlanProgress" "CompletionStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "UserDailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavoriteWorkout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavoriteWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavoriteRecipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavoriteRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "paymentId" TEXT NOT NULL,
    "hasFeedback" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "state" "PaymentState" NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT,
    "courseId" TEXT NOT NULL,
    "type" "UserAccessType" NOT NULL,
    "reason" "UserAccessReason" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enrollmentId" TEXT NOT NULL,

    CONSTRAINT "UserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCourseEnrollment_userId_startDate_idx" ON "UserCourseEnrollment"("userId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserCourseEnrollment_userId_courseId_key" ON "UserCourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "UserDailyPlan_enrollmentId_idx" ON "UserDailyPlan"("enrollmentId");

-- CreateIndex
CREATE INDEX "UserDailyPlan_userId_date_idx" ON "UserDailyPlan"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyPlan_userId_date_key" ON "UserDailyPlan"("userId", "date");

-- CreateIndex
CREATE INDEX "UserFavoriteWorkout_userId_idx" ON "UserFavoriteWorkout"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteWorkout_userId_workoutId_key" ON "UserFavoriteWorkout"("userId", "workoutId");

-- CreateIndex
CREATE INDEX "UserFavoriteRecipe_userId_idx" ON "UserFavoriteRecipe"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteRecipe_userId_recipeId_key" ON "UserFavoriteRecipe"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccess_enrollmentId_key" ON "UserAccess"("enrollmentId");

-- CreateIndex
CREATE INDEX "MealPlan_courseId_idx" ON "MealPlan"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workout_slug_key" ON "Workout"("slug");

-- AddForeignKey
ALTER TABLE "UserCourseEnrollment" ADD CONSTRAINT "UserCourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCourseEnrollment" ADD CONSTRAINT "UserCourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_warmupId_fkey" FOREIGN KEY ("warmupId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "UserCourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_warmupId_fkey" FOREIGN KEY ("warmupId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_mainWorkoutId_fkey" FOREIGN KEY ("mainWorkoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_breakfastRecipeId_fkey" FOREIGN KEY ("breakfastRecipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_lunchRecipeId_fkey" FOREIGN KEY ("lunchRecipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_dinnerRecipeId_fkey" FOREIGN KEY ("dinnerRecipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteWorkout" ADD CONSTRAINT "UserFavoriteWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteWorkout" ADD CONSTRAINT "UserFavoriteWorkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteRecipe" ADD CONSTRAINT "UserFavoriteRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteRecipe" ADD CONSTRAINT "UserFavoriteRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccess" ADD CONSTRAINT "UserAccess_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "UserCourseEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
