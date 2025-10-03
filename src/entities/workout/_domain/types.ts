import { MuscleGroup, WorkoutDifficulty, WorkoutType } from '@prisma/client'

export type Workout = {
  id: string
  slug: string
  title: string
  type: WorkoutType
  durationSec: number
  difficulty: WorkoutDifficulty
  equipment: string[]
  description: string | null
  videoId: string | null
  muscles: MuscleGroup[]
  poster: Record<string, string> | null
  posterUrl: string | null
  progress: number | null
}
