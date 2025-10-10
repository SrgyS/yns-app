/*
  Warnings:

  - The values [course] on the enum `UserAccessType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserAccessType_new" AS ENUM ('fixed', 'subscription');
ALTER TABLE "public"."UserAccess" ALTER COLUMN "type" TYPE "public"."UserAccessType_new" USING ("type"::text::"public"."UserAccessType_new");
ALTER TYPE "public"."UserAccessType" RENAME TO "UserAccessType_old";
ALTER TYPE "public"."UserAccessType_new" RENAME TO "UserAccessType";
DROP TYPE "public"."UserAccessType_old";
COMMIT;

-- DropEnum
DROP TYPE "public"."ProductType";
