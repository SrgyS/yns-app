import { DayOfWeek } from '@prisma/client'

/**
 * Доменная модель для планирования
 */
export interface Planning {
  id: string
  enrollmentId: string
  scope: PlanningScope
  status: PlanningStatus
  createdAt: Date
  updatedAt: Date
}

/**
 * Область планирования
 */
export type PlanningScope = 
  | { type: 'full' }
  | { type: 'week'; weekNumber: number }

/**
 * Статус планирования
 */
export type PlanningStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'

/**
 * Контекст планирования для генерации
 */
export interface PlanningContext {
  enrollmentId: string
  userId: string
  courseId: string
  startDate: Date
  selectedWorkoutDays: DayOfWeek[]
  durationWeeks: number
  minWorkoutDaysPerWeek: number
}

/**
 * Результат планирования
 */
export interface PlanningResult {
  success: boolean
  plansCreated: number
  plansUpdated: number
  errors: string[]
}

/**
 * Метрики планирования
 */
export interface PlanningMetrics {
  totalPlans: number
  workoutDays: number
  warmupOnlyDays: number
  weeksGenerated: number
  averagePlansPerWeek: number
}

/**
 * Опции для генерации планов
 */
export interface PlanGenerationOptions {
  scope: PlanningScope
  validatePlans?: boolean
  overwriteExisting?: boolean
}

/**
 * Опции для обновления планов
 */
export interface PlanUpdateOptions {
  selectedWorkoutDays: DayOfWeek[]
  preserveProgress?: boolean
  validatePlans?: boolean
}