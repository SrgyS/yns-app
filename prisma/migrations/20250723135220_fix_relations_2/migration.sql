/*
  Warnings:

  - A unique constraint covering the columns `[courseId,slug]` on the table `MealPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_courseId_slug_key" ON "MealPlan"("courseId", "slug");
