/*
  Warnings:

  - You are about to drop the `Week` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DailyPlan" DROP CONSTRAINT "DailyPlan_weekId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Week" DROP CONSTRAINT "Week_courseId_fkey";

-- DropTable
DROP TABLE "public"."Week";

-- CreateTable
CREATE TABLE "public"."weeks" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "releaseAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weeks_courseId_weekNumber_key" ON "public"."weeks"("courseId", "weekNumber");

-- AddForeignKey
ALTER TABLE "public"."weeks" ADD CONSTRAINT "weeks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlan" ADD CONSTRAINT "DailyPlan_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "public"."weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
