-- DropForeignKey
ALTER TABLE "public"."DailyPlan" DROP CONSTRAINT "DailyPlan_mealPlanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserDailyPlan" DROP CONSTRAINT "UserDailyPlan_mealPlanId_fkey";

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "contentType" "public"."CourseContentType" NOT NULL DEFAULT 'FIXED_COURSE';

-- AlterTable
ALTER TABLE "public"."DailyPlan" ALTER COLUMN "mealPlanId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserDailyPlan" ALTER COLUMN "mealPlanId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."DailyPlan" ADD CONSTRAINT "DailyPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "public"."MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDailyPlan" ADD CONSTRAINT "UserDailyPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "public"."MealPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
