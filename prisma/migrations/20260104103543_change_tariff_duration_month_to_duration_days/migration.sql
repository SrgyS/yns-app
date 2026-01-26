/*
  Warnings:

  - You are about to drop the column `durationMonths` on the `CourseTariff` table. All the data in the column will be lost.
  - You are about to drop the `CourseProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CourseProduct" DROP CONSTRAINT "CourseProduct_courseId_fkey";

-- AlterTable
ALTER TABLE "CourseTariff" DROP COLUMN "durationMonths",
ADD COLUMN     "durationDays" INTEGER;

-- DropTable
DROP TABLE "CourseProduct";
