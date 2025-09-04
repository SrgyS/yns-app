-- DropForeignKey
ALTER TABLE "public"."CourseProduct" DROP CONSTRAINT "CourseProduct_courseId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."CourseProduct"("courseId") ON DELETE CASCADE ON UPDATE CASCADE;
