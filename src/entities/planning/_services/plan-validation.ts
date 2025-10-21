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
  requiredMainWorkoutDays: number
  requiredWarmupOnlyDays: number
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
    const allowed = course.allowedWorkoutDaysPerWeek && course.allowedWorkoutDaysPerWeek.length > 0
      ? course.allowedWorkoutDaysPerWeek
      : [5]
    const maxWorkoutDaysPerWeek = Math.max(...allowed)
    const requiredMainWorkoutDays = maxWorkoutDaysPerWeek * course.durationWeeks
    const requiredWarmupOnlyDays = totalDays - requiredMainWorkoutDays

    return {
      maxWorkoutDaysPerWeek,
      durationWeeks: course.durationWeeks,
      totalDays,
      requiredMainWorkoutDays,
      requiredWarmupOnlyDays,
    }
  }

  /**
   * Разделить планы на тренировочные и разминочные
   */
  categorizePlans(dailyPlans: PrismaDailyPlan[]) {
    const mainWorkoutDays = dailyPlans.filter(dp => dp.mainWorkoutId !== null)
    const warmupOnlyDays = dailyPlans.filter(dp => dp.mainWorkoutId === null)

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
    dailyPlans: PrismaDailyPlan[]
  ): ValidationResult {
    const errors: string[] = []
    const requirements = this.calculatePlanRequirements(course)
    const { mainWorkoutDays, warmupOnlyDays } = this.categorizePlans(dailyPlans)

    if (mainWorkoutDays.length < requirements.requiredMainWorkoutDays) {
      errors.push(
        `Not enough main workout days: required ${requirements.requiredMainWorkoutDays}, got ${mainWorkoutDays.length} for a ${course.durationWeeks}-week course`
      )
    }

    // Проверка достаточности разминочных дней
    if (warmupOnlyDays.length < requirements.requiredWarmupOnlyDays) {
      errors.push(
        `Not enough warmup-only days: required ${requirements.requiredWarmupOnlyDays}, got ${warmupOnlyDays.length} for a ${course.durationWeeks}-week course`
      )
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

    if (isWorkoutDay && mainWorkoutIndex < mainWorkoutDays.length) {
      plan = mainWorkoutDays[mainWorkoutIndex]
      newMainWorkoutIndex++
    } else if (warmupOnlyIndex < warmupOnlyDays.length) {
      plan = warmupOnlyDays[warmupOnlyIndex]
      newWarmupOnlyIndex++
    } else {
      // Сброс индекса разминочных дней и взятие первого
      newWarmupOnlyIndex = 1
      plan = warmupOnlyDays[0]
    }

    return {
      plan,
      newMainWorkoutIndex,
      newWarmupOnlyIndex,
    }
  }
}
