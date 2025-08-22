/*
  Warnings:

  - You are about to drop the column `durationMinutes` on the `Workout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Workout" DROP COLUMN "durationMinutes",
ADD COLUMN     "durationSec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "posterUrl" TEXT;
