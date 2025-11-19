ALTER TABLE "UserAccess" ADD CONSTRAINT "UserAccess_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "UserCourseEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
