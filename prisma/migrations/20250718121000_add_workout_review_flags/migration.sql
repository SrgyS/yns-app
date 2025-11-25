-- Add review/sync flags to workouts to prevent overwriting manual edits
ALTER TABLE "Workout"
ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN "manuallyEdited" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN "lastSyncedAt" TIMESTAMP;
