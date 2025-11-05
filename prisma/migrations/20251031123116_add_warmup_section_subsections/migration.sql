/*
  Warnings:

  - Added the required column `section` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkoutSection" AS ENUM ('STRENGTH', 'CORRECTION', 'FUNCTIONAL', 'WARMUP', 'PAIN');

-- CreateEnum
CREATE TYPE "WorkoutSubsection" AS ENUM ('UPPER_BODY', 'LOWER_BODY', 'FULL_BODY', 'SPINE', 'JOINT', 'ANTI_EDEMA', 'ANTI_TENSION', 'PELVIC_FLOOR', 'STRETCHING', 'INERTIAL', 'NECK', 'BACK', 'FEET', 'ABDOMEN', 'PELVIS_SPINE', 'BREATHING', 'ENERGY_BOOST', 'PILATES', 'PELVIC_HIP_JOINT');

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "section" "WorkoutSection" NOT NULL,
ADD COLUMN     "subsections" "WorkoutSubsection"[];
