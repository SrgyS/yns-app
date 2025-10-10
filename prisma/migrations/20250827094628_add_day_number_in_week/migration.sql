/*
  Warnings:

  - Added the required column `dayNumberInWeek` to the `UserDailyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add column with default value first
ALTER TABLE "public"."UserDailyPlan" ADD COLUMN "dayNumberInWeek" INTEGER DEFAULT 1;

-- Update existing records: calculate dayNumberInWeek based on dayNumberInCourse
-- dayNumberInWeek = ((dayNumberInCourse - 1) % 7) + 1
UPDATE "public"."UserDailyPlan" 
SET "dayNumberInWeek" = (("dayNumberInCourse" - 1) % 7) + 1;

-- Remove default value to make it required
ALTER TABLE "public"."UserDailyPlan" ALTER COLUMN "dayNumberInWeek" DROP DEFAULT;
ALTER TABLE "public"."UserDailyPlan" ALTER COLUMN "dayNumberInWeek" SET NOT NULL;
