import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

import type { PracticeSubcategory } from '../_domain/practice-types'
import { PRACTICE_TYPES } from '../_constants/practice-types'

export function findPracticeTypeBySection(section: WorkoutSection) {
  return (
    PRACTICE_TYPES.find(
      type => type.section === section && type.subcategories.length > 0
    ) ?? PRACTICE_TYPES.find(type => type.section === section)
  )
}

export function findSubcategory(
  section: WorkoutSection,
  value: WorkoutSubsection
): PracticeSubcategory | undefined {
  for (const type of PRACTICE_TYPES) {
    if (type.section !== section) continue
    const match = type.subcategories.find(sub => sub.value === value)
    if (match) {
      return match
    }
  }
  return undefined
}
