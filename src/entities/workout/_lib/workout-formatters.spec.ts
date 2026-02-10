import { MuscleGroup, WorkoutDifficulty } from '@prisma/client'

import {
  formatEquipmentList,
  formatMuscleLabels,
  getDifficultyLabel,
  getDifficultyLevel,
  getDurationMinutes,
} from './workout-formatters'

describe('workout formatters', () => {
  test('getDurationMinutes returns null for non-positive and rounds', () => {
    expect(getDurationMinutes(undefined)).toBeNull()
    expect(getDurationMinutes(0)).toBeNull()
    expect(getDurationMinutes(-10)).toBeNull()
    expect(getDurationMinutes(59)).toBe(1)
    expect(getDurationMinutes(120)).toBe(2)
  })

  test('formats equipment, muscles, and difficulty labels', () => {
    expect(formatEquipmentList(['mat', 'dumbbell'])).toBe('Mat, Dumbbell')
    expect(formatEquipmentList([])).toBeNull()
    expect(
      formatMuscleLabels([MuscleGroup.GLUTES, MuscleGroup.BACK])
    ).toEqual(['Ягодицы', 'Спина'])
    expect(getDifficultyLevel(WorkoutDifficulty.MEDIUM)).toBe(2)
    expect(getDifficultyLabel(WorkoutDifficulty.HARD)).toBe('Сложно')
    expect(getDifficultyLabel(null)).toBeNull()
  })
})
