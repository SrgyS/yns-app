-- AlterEnum
ALTER TYPE "public"."MuscleGroup" ADD VALUE 'CORE';

-- AlterEnum
ALTER TYPE "public"."WorkoutType" ADD VALUE 'CARDIO';

-- DropEnum
DROP TYPE "public"."CompletionStatus";
