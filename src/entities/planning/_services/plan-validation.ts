import {
  DailyPlan as PrismaDailyPlan,
  Course as PrismaCourse,
} from '@prisma/client'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface PlanRequirements {
  maxWorkoutDaysPerWeek: number
  durationWeeks: number
  totalDays: number
}

/**
 * Сервис для валидации планов курса
 */
export class PlanValidationService {
  /**
   * Вычислить требования к планам для курса
   */
  calculatePlanRequirements(
    course: Pick<PrismaCourse, 'durationWeeks' | 'allowedWorkoutDaysPerWeek'>
  ): PlanRequirements {
    const totalDays = course.durationWeeks * 7
    const allowed =
      course.allowedWorkoutDaysPerWeek &&
      course.allowedWorkoutDaysPerWeek.length > 0
        ? course.allowedWorkoutDaysPerWeek
        : [5]
    const maxWorkoutDaysPerWeek = Math.max(...allowed)

    return {
      maxWorkoutDaysPerWeek,
      durationWeeks: course.durationWeeks,
      totalDays,
    }
  }

  /**
   * Разделить планы на тренировочные и разминочные
   */
  categorizePlans<T extends PrismaDailyPlan & { mainWorkouts?: any[] }>(
    dailyPlans: T[]
  ) {
    const mainWorkoutDays = dailyPlans.filter(
      dp => Array.isArray(dp.mainWorkouts) && dp.mainWorkouts.length > 0
    )
    const warmupOnlyDays = dailyPlans.filter(
      dp => !Array.isArray(dp.mainWorkouts) || dp.mainWorkouts.length === 0
    )

    return {
      mainWorkoutDays,
      warmupOnlyDays,
    }
  }

  /**
   * Валидировать планы курса
   */
  validateCoursePlans(
    course: PrismaCourse,
    dailyPlans: (PrismaDailyPlan & { mainWorkouts?: any[] })[]
  ): ValidationResult {
    const errors: string[] = []
    const requirements = this.calculatePlanRequirements(course)
    const { mainWorkoutDays } = this.categorizePlans(dailyPlans)

    const plansMissingWarmup = dailyPlans.filter(dp => !dp.warmupId)
    if (plansMissingWarmup.length > 0) {
      errors.push(
        `Missing warmup in ${plansMissingWarmup.length} day(s); fill warmups before publish`
      )
    }

    const weeklyMainCounts = new Map<number, number>()
    for (const plan of mainWorkoutDays) {
      weeklyMainCounts.set(
        plan.weekNumber,
        (weeklyMainCounts.get(plan.weekNumber) ?? 0) + 1
      )
    }

    for (let week = 1; week <= requirements.durationWeeks; week++) {
      const count = weeklyMainCounts.get(week) ?? 0
      if (count > requirements.maxWorkoutDaysPerWeek) {
        errors.push(
          `В неделе ${week} больше тренировочных дней (${count}), чем допускается (${requirements.maxWorkoutDaysPerWeek}).`
        )
      }
      if (count < requirements.maxWorkoutDaysPerWeek) {
        errors.push(
          `В неделе ${week} меньше тренировочных дней (${count}), чем требуется (${requirements.maxWorkoutDaysPerWeek}).`
        )
      }
    }

    if (mainWorkoutDays.length === 0) {
      errors.push('Нет ни одного дня с основной тренировкой')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Получить следующий план для генерации
   */
  getNextPlan(
    isWorkoutDay: boolean,
    mainWorkoutDays: PrismaDailyPlan[],
    warmupOnlyDays: PrismaDailyPlan[],
    mainWorkoutIndex: number,
    warmupOnlyIndex: number
  ): {
    plan: PrismaDailyPlan
    newMainWorkoutIndex: number
    newWarmupOnlyIndex: number
  } {
    let plan: PrismaDailyPlan
    let newMainWorkoutIndex = mainWorkoutIndex
    let newWarmupOnlyIndex = warmupOnlyIndex

    const hasMainWorkouts = mainWorkoutDays.length > 0
    const hasWarmupOnlyDays = warmupOnlyDays.length > 0

    if (isWorkoutDay && hasMainWorkouts) {
      const normalizedIndex = mainWorkoutIndex % mainWorkoutDays.length
      plan = mainWorkoutDays[normalizedIndex]
      newMainWorkoutIndex++
    } else if (warmupOnlyIndex < warmupOnlyDays.length) {
      plan = warmupOnlyDays[warmupOnlyIndex]
      newWarmupOnlyIndex++
    } else if (hasWarmupOnlyDays) {
      // Сброс индекса разминочных дней и взятие первого
      newWarmupOnlyIndex = 1
      plan = warmupOnlyDays[0]
    } else if (hasMainWorkouts) {
      const normalizedIndex = mainWorkoutIndex % mainWorkoutDays.length
      plan = mainWorkoutDays[normalizedIndex]
      newMainWorkoutIndex++
    } else {
      throw new Error(
        'No available plans to assign for user daily plan generation'
      )
    }

    return {
      plan,
      newMainWorkoutIndex,
      newWarmupOnlyIndex,
    }
  }
}
