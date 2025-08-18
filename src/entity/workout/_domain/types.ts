import { MuscleGroup, WorkoutDifficulty, WorkoutType } from '@prisma/client'

export type Workout = {
  id: string
  slug: string
  title: string
  type: WorkoutType
  durationMinutes: number
  difficulty: WorkoutDifficulty
  equipment: string[]
  description: string | null
  videoUrl: string | null
  muscles: MuscleGroup[]
}