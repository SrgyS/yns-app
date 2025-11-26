-- Drop type usage and enum now that WorkoutType is removed from the schema
ALTER TABLE "Workout" DROP COLUMN IF EXISTS "type";

ALTER TABLE "UserWorkoutCompletion" DROP COLUMN IF EXISTS "workoutType";

DROP TYPE IF EXISTS "WorkoutType";
