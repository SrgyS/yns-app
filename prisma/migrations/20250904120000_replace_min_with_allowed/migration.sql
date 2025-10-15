ALTER TABLE "Course"
    ADD COLUMN "allowedWorkoutDaysPerWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

UPDATE "Course"
SET "allowedWorkoutDaysPerWeek" = CASE
    WHEN "minWorkoutDaysPerWeek" IS NOT NULL THEN ARRAY["minWorkoutDaysPerWeek"]
    ELSE ARRAY[5]
END;

ALTER TABLE "Course"
    DROP COLUMN "minWorkoutDaysPerWeek";
