/*
  Warnings:

  - You are about to drop the column `videoDurationSeconds` on the `Workout` table. All the data in the column will be lost.
  - You are about to drop the column `videoPosters` on the `Workout` table. All the data in the column will be lost.
  - You are about to drop the column `videoProcessingProgress` on the `Workout` table. All the data in the column will be lost.
  - Added the required column `durationMinutes` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Workout" DROP COLUMN "videoDurationSeconds",
DROP COLUMN "videoPosters",
DROP COLUMN "videoProcessingProgress",
ADD COLUMN     "durationMinutes" INTEGER NOT NULL,
ADD COLUMN     "poster" JSONB,
ADD COLUMN     "progress" INTEGER;
