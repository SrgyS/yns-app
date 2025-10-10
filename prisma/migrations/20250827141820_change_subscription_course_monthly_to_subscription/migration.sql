/*
  Warnings:

  - The values [SUBSCRIPTION_COURSE_MONTHLY] on the enum `CourseContentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CourseContentType_new" AS ENUM ('FIXED_COURSE', 'SUBSCRIPTION');
ALTER TABLE "public"."Course" ALTER COLUMN "contentType" DROP DEFAULT;
ALTER TABLE "public"."Course" ALTER COLUMN "contentType" TYPE "public"."CourseContentType_new" USING ("contentType"::text::"public"."CourseContentType_new");
ALTER TABLE "public"."Product" ALTER COLUMN "type" TYPE "public"."CourseContentType_new" USING ("type"::text::"public"."CourseContentType_new");
ALTER TYPE "public"."CourseContentType" RENAME TO "CourseContentType_old";
ALTER TYPE "public"."CourseContentType_new" RENAME TO "CourseContentType";
DROP TYPE "public"."CourseContentType_old";
ALTER TABLE "public"."Course" ALTER COLUMN "contentType" SET DEFAULT 'FIXED_COURSE';
COMMIT;
