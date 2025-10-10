/*
  Warnings:

  - A unique constraint covering the columns `[userId,courseId,type]` on the table `UserAccess` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."UserAccess" DROP CONSTRAINT "UserAccess_enrollmentId_fkey";

-- AlterTable
ALTER TABLE "public"."UserAccess" ALTER COLUMN "enrollmentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "UserAccess_userId_courseId_idx" ON "public"."UserAccess"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccess_userId_courseId_type_key" ON "public"."UserAccess"("userId", "courseId", "type");

-- AddForeignKey
ALTER TABLE "public"."UserAccess" ADD CONSTRAINT "UserAccess_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."UserCourseEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
