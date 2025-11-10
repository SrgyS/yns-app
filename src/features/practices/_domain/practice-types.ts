import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

export type PracticeTypeKey =
  | 'warmup'
  | 'strength'
  | 'functional'
  | 'correction'
  | 'pain'

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

export type PracticeGroupKey = 'favorite'

export type PracticeGroup = {
  key: PracticeGroupKey
  title: string
  description: string
  imagePath?: string
}
