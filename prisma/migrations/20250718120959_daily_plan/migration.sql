/*
  Warnings:

  - You are about to drop the column `name` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contentType` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `draft` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('text');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('free', 'paid');

-- CreateEnum
CREATE TYPE "WorkoutDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MealCategory" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'SALAD', 'DESSERT', 'SOUP');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('WARMUP', 'POSTURE', 'STRENGTH', 'MOBILITY');

-- CreateEnum
CREATE TYPE "CourseContentType" AS ENUM ('FIXED_COURSE', 'SUBSCRIPTION_COURSE_MONTHLY');

-- CreateEnum
CREATE TYPE "MdxType" AS ENUM ('courseLanding', 'courseShortDescription', 'contentBlockText', 'dailyPlanShortDescription');

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "name",
ADD COLUMN     "contentType" "CourseContentType" NOT NULL,
ADD COLUMN     "draft" BOOLEAN NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "landing" TEXT,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "shortDescriptionId" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "thumbnail" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedWorkoutDays" TEXT[];

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "shortDescriptionId" TEXT,
    "warmupId" TEXT,
    "mainWorkoutId" TEXT,
    "mealPlanId" TEXT,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "WorkoutType" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "difficulty" "WorkoutDifficulty" NOT NULL,
    "equipment" TEXT[],
    "description" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "preparationTimeMinutes" INTEGER NOT NULL,
    "calories" INTEGER,
    "servings" INTEGER NOT NULL,
    "difficulty" "RecipeDifficulty" NOT NULL,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isSugarFree" BOOLEAN NOT NULL DEFAULT false,
    "mealCategories" "MealCategory"[],
    "mealPlanId" TEXT,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightGrams" INTEGER,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyContent" (
    "id" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "WeeklyContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteWorkout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteRecipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "text" TEXT,
    "dailyPlanId" TEXT NOT NULL,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseDependency" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "CourseDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProduct" (
    "id" TEXT NOT NULL,
    "access" "AccessType" NOT NULL,
    "price" INTEGER,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MdxText" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "MdxType" NOT NULL,
    "relationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "MdxText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WeeklyContentDailyPlans" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WeeklyContentDailyPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_courseId_slug_key" ON "DailyPlan"("courseId", "slug");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteWorkout_userId_workoutId_key" ON "FavoriteWorkout"("userId", "workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteRecipe_userId_recipeId_key" ON "FavoriteRecipe"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseDependency_courseId_dependsOnId_key" ON "CourseDependency"("courseId", "dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProduct_courseId_key" ON "CourseProduct"("courseId");

-- CreateIndex
CREATE INDEX "_WeeklyContentDailyPlans_B_index" ON "_WeeklyContentDailyPlans"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_warmupId_fkey" FOREIGN KEY ("warmupId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_mainWorkoutId_fkey" FOREIGN KEY ("mainWorkoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteWorkout" ADD CONSTRAINT "FavoriteWorkout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteWorkout" ADD CONSTRAINT "FavoriteWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseDependency" ADD CONSTRAINT "CourseDependency_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseDependency" ADD CONSTRAINT "CourseDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProduct" ADD CONSTRAINT "CourseProduct_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WeeklyContentDailyPlans" ADD CONSTRAINT "_WeeklyContentDailyPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WeeklyContentDailyPlans" ADD CONSTRAINT "_WeeklyContentDailyPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "WeeklyContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
