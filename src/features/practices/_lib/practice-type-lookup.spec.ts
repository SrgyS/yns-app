import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

import { findPracticeTypeBySection, findSubcategory } from './practice-type-lookup'

describe('practice type lookup', () => {
  test('finds practice types and subcategories', () => {
    const warmup = findPracticeTypeBySection(WorkoutSection.WARMUP)
    expect(warmup?.key).toBe('warmup')
    expect(warmup?.subcategories.length).toBeGreaterThan(0)

    const pain = findPracticeTypeBySection(WorkoutSection.PAIN)
    expect(pain?.key).toBe('pain')
    expect(pain?.subcategories.length).toBe(0)

    const abdomen = findSubcategory(
      WorkoutSection.WARMUP,
      WorkoutSubsection.ABDOMEN
    )
    expect(abdomen?.key).toBe('abdomen')

    const missing = findSubcategory(
      WorkoutSection.WARMUP,
      WorkoutSubsection.NECK
    )
    expect(missing).toBeUndefined()
  })
})
