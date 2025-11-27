-- Drop slug column from Workout safely (after reset)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Workout' AND column_name = 'slug'
  ) THEN
    ALTER TABLE "Workout" DROP COLUMN "slug";
  END IF;
END $$;
