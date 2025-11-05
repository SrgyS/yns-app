import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

export type PracticeTypeKey =
  | 'warmup'
  | 'strength'
  | 'functional'
  | 'correction'
  | 'favorite'
  | 'bonus'

export type PracticeSubcategory = {
  key: string
  title: string
  description?: string
  imagePath?: string
  value: WorkoutSubsection
}

export type PracticeType = {
  key: PracticeTypeKey
  title: string
  description: string
  imagePath?: string
  section: WorkoutSection
  subcategories: PracticeSubcategory[]
}
