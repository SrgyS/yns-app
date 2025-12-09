import {
  MuscleGroup,
  WorkoutDifficulty,
  WorkoutSection,
  WorkoutSubsection,
} from '@prisma/client'
import { PRACTICE_TYPES } from '@/features/practices/_constants/practice-types'

export const enumOptions = {
  difficulty: Object.values(WorkoutDifficulty),
  muscles: Object.values(MuscleGroup),
}

export const muscleLabels: Record<MuscleGroup, string> = {
  LEGS: 'Ноги',
  GLUTES: 'Ягодицы',
  UPPER_BODY: 'Верхняя часть тела',
  BACK: 'Спина',
  PELVIC_FLOOR: 'Мышцы тазового дна',
  CORE: 'Кор',
}

export const practiceSections = Array.from(
  new Set(PRACTICE_TYPES.map(practice => practice.section))
)

export const sectionLabels = PRACTICE_TYPES.reduce<Record<WorkoutSection, string>>(
  (acc, practice) => {
    if (!acc[practice.section]) {
      acc[practice.section] = practice.title
    }
    return acc
  },
  {} as Record<WorkoutSection, string>
)

export const subsectionsBySection = PRACTICE_TYPES.reduce<
  Record<WorkoutSection, WorkoutSubsection[]>
>(
  (acc, practice) => {
    acc[practice.section] = practice.subcategories.map(
      subcategory => subcategory.value
    )
    return acc
  },
  {} as Record<WorkoutSection, WorkoutSubsection[]>
)

export const subsectionLabels = PRACTICE_TYPES.reduce<
  Partial<Record<WorkoutSubsection, string>>
>((acc, practice) => {
  for (const subcategory of practice.subcategories) {
    acc[subcategory.value] = subcategory.title
  }
  return acc
}, {})
