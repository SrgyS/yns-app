import {
  MuscleGroup,
  WorkoutDifficulty,
  WorkoutSection,
  WorkoutSubsection,
} from '@prisma/client'

export type Workout = {
  id: string
  slug: string
  title: string
  durationSec: number
  difficulty: WorkoutDifficulty
  equipment: string[]
  description: string | null
  videoId: string | null
  muscles: MuscleGroup[]
  section: WorkoutSection
  subsections: WorkoutSubsection[]
  poster: Record<string, string> | null
  posterUrl: string | null
  progress: number | null
}
