import upperFirst from 'lodash-es/upperFirst'
import { MuscleGroup, WorkoutDifficulty } from '@prisma/client'

const MUSCLE_GROUP_LABELS: Partial<Record<MuscleGroup, string>> = {
  LEGS: 'Ноги',
  GLUTES: 'Ягодицы',
  UPPER_BODY: 'Верх тела',
  BACK: 'Спина',
  PELVIC_FLOOR: 'Тазовое дно',
  CORE: 'Кор',
}

const DIFFICULTY_LEVELS: Record<WorkoutDifficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
}

const DIFFICULTY_LABELS: Record<WorkoutDifficulty, string> = {
  EASY: 'Легко',
  MEDIUM: 'Средне',
  HARD: 'Сложно',
}

export function getDurationMinutes(durationSec?: number | null): number | null {
  if (!durationSec || durationSec <= 0) return null
  return Math.max(1, Math.round(durationSec / 60))
}

export function formatEquipmentList(
  equipment?: string[] | null
): string | null {
  if (!Array.isArray(equipment) || equipment.length === 0) {
    return null
  }

  const normalized = equipment.map(item => upperFirst(item)).filter(Boolean)
  if (normalized.length === 0) {
    return null
  }

  return normalized.join(', ')
}

export function formatMuscleLabels(
  muscles?: MuscleGroup[] | null
): string[] {
  if (!Array.isArray(muscles) || muscles.length === 0) {
    return []
  }

  return muscles
    .map(
      muscle =>
        MUSCLE_GROUP_LABELS[muscle] ??
        upperFirst(muscle.toLowerCase().replace(/_/g, ' '))
    )
    .filter(Boolean)
}

export function getDifficultyLevel(
  difficulty?: WorkoutDifficulty | null
): number {
  if (!difficulty) return 0
  return DIFFICULTY_LEVELS[difficulty] ?? 0
}

export function getDifficultyLabel(
  difficulty?: WorkoutDifficulty | null
): string | null {
  if (!difficulty) return null
  return DIFFICULTY_LABELS[difficulty] ?? null
}
