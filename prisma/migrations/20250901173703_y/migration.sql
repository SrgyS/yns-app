-- DropForeignKey
ALTER TABLE "public"."Course" DROP CONSTRAINT "Course_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."CourseProduct" ADD CONSTRAINT "CourseProduct_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
