/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `Workout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Workout" DROP COLUMN "videoUrl",
ADD COLUMN     "videoId" TEXT;
