-- Drop the unique constraint to allow multiple access records per course
ALTER TABLE "UserAccess" DROP CONSTRAINT IF EXISTS "UserAccess_userId_courseId_contentType_key";
