-- CreateTable
CREATE TABLE "public"."UserWorkoutCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutType" "public"."WorkoutType" NOT NULL,

    CONSTRAINT "UserWorkoutCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserWorkoutCompletion_userId_idx" ON "public"."UserWorkoutCompletion"("userId");

-- CreateIndex
CREATE INDEX "UserWorkoutCompletion_enrollmentId_idx" ON "public"."UserWorkoutCompletion"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkoutCompletion_userId_workoutId_enrollmentId_workout_key" ON "public"."UserWorkoutCompletion"("userId", "workoutId", "enrollmentId", "workoutType");

-- AddForeignKey
ALTER TABLE "public"."UserWorkoutCompletion" ADD CONSTRAINT "UserWorkoutCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWorkoutCompletion" ADD CONSTRAINT "UserWorkoutCompletion_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWorkoutCompletion" ADD CONSTRAINT "UserWorkoutCompletion_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."UserCourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
