/*
  Warnings:

  - You are about to drop the column `durationMinutes` on the `Workout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Workout" DROP COLUMN "durationMinutes",
ADD COLUMN     "videoDurationSeconds" INTEGER,
ADD COLUMN     "videoPosters" JSONB,
ADD COLUMN     "videoProcessingProgress" INTEGER;
