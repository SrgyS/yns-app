/*
  Warnings:

  - You are about to drop the column `type` on the `UserAccess` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,courseId,contentType]` on the table `UserAccess` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contentType` to the `UserAccess` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."UserAccess_userId_courseId_type_key";

-- AlterTable
ALTER TABLE "public"."UserAccess" DROP COLUMN "type",
ADD COLUMN     "contentType" "public"."CourseContentType" NOT NULL;

-- DropEnum
DROP TYPE "public"."UserAccessType";

-- CreateIndex
CREATE UNIQUE INDEX "UserAccess_userId_courseId_contentType_key" ON "public"."UserAccess"("userId", "courseId", "contentType");
