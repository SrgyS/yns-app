import {
  DayOfWeek,
  DailyPlan as PrismaDailyPlan,
  Course as PrismaCourse,
} from '@prisma/client'
import { DateCalculationService } from './date-calculation'
import { PlanValidationService } from './plan-validation'

export interface GenerationContext {
  enrollment: {
    id: string
    userId: string
    startDate: Date
    selectedWorkoutDays: DayOfWeek[]
  }
  course: Pick<PrismaCourse, 'durationWeeks' | 'allowedWorkoutDaysPerWeek'> & {
    dailyPlans: PrismaDailyPlan[]
  }
}

export interface UserDailyPlanCreateData {
  userId: string
  enrollmentId: string
  date: Date
  dayNumberInCourse: number
  weekNumber: number
  dayOfWeek: DayOfWeek
  isWorkoutDay: boolean
  warmupId: string
  mainWorkoutId: string | null
  mealPlanId: string | null
  originalDailyPlanId: string
  warmupStepIndex: number
  mainWorkoutStepIndex: number | null
}

export interface UserDailyPlanUpdateData {
  isWorkoutDay: boolean
  dayOfWeek: DayOfWeek
  weekNumber: number
  warmupId: string
  mainWorkoutId: string | null
  mealPlanId: string | null
  originalDailyPlanId: string
  warmupStepIndex: number
  mainWorkoutStepIndex: number | null
}

export interface GenerationRange {
  startDay: number
  endDay: number
}

interface DayIterationMeta {
  dayIndex: number
  date: Date
  dayOfWeek: DayOfWeek
  isWorkoutDay: boolean
  weekNumber: number
  warmupStepIndex: number
  mainWorkoutStepIndex: number | null
}

/**
 * Сервис для генерации планов пользователей
 * Отвечает за создание и обновление UserDailyPlan
 */
export class PlanGenerationService {
  constructor(
    private readonly dateService: DateCalculationService,
    private readonly validationService: PlanValidationService
  ) {}

  /**
   * Подготавливает контекст для генерации планов
   */
  prepareGenerationContext(
    enrollment: GenerationContext['enrollment'],
    course: GenerationContext['course']
  ): GenerationContext {
    return {
      enrollment,
      course,
    }
  }

  /**
   * Вычисляет диапазон дней для генерации
   */
  calculateGenerationRange(
    scope: 'full' | { week: number },
    context: GenerationContext
  ): GenerationRange {
    if (scope === 'full') {
      const requirements = this.validationService.calculatePlanRequirements(
        context.course
      )
      const { mainWorkoutDays } = this.validationService.categorizePlans(
        context.course.dailyPlans
      )
      const requiredMain = mainWorkoutDays.length
      const selectedWorkoutDaysCount = Math.max(
        context.enrollment.selectedWorkoutDays.length,
        1
      )

      // Считаем, сколько выбранных тренировочных дней осталось в первой неделе,
      // начиная с даты старта (чтобы старт в середине недели не обрезал доступность тренировок).
      const dayOrder: DayOfWeek[] = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ]
      const startDayIndex = dayOrder.indexOf(
        this.dateService.getDayOfWeek(context.enrollment.startDate)
      )
      const slotsInFirstWeek =
        context.enrollment.selectedWorkoutDays.filter(
          day => dayOrder.indexOf(day) >= startDayIndex
        ).length

      const remainingWorkouts = Math.max(requiredMain - slotsInFirstWeek, 0)
      const additionalWeeks =
        remainingWorkouts > 0
          ? Math.ceil(remainingWorkouts / selectedWorkoutDaysCount)
          : 0

      const totalWeeks = Math.max(
        requirements.durationWeeks,
        1 + additionalWeeks
      )

      return {
        startDay: 0,
        endDay: totalWeeks * 7,
      }
    }

    const weekStartDay = (scope.week - 1) * 7
    return {
      startDay: weekStartDay,
      endDay: weekStartDay + 7,
    }
  }

  /**
   * Создает данные для UserDailyPlan
   */
  createUserDailyPlanData(
    context: GenerationContext,
    plan: PrismaDailyPlan,
    meta: DayIterationMeta
  ): UserDailyPlanCreateData {
    return {
      userId: context.enrollment.userId,
      enrollmentId: context.enrollment.id,
      date: meta.date,
      dayNumberInCourse: meta.dayIndex + 1,
      weekNumber: meta.weekNumber,
      dayOfWeek: meta.dayOfWeek,
      isWorkoutDay: meta.isWorkoutDay,
      warmupId: plan.warmupId,
      mainWorkoutId: meta.isWorkoutDay ? plan.mainWorkoutId : null,
      mealPlanId: plan.mealPlanId ?? null,
      originalDailyPlanId: plan.id,
      warmupStepIndex: meta.warmupStepIndex,
      mainWorkoutStepIndex: meta.mainWorkoutStepIndex,
    }
  }

  /**
   * Создает данные для обновления UserDailyPlan
   */
  createUserDailyPlanUpdateData(
    context: GenerationContext,
    plan: PrismaDailyPlan,
    meta: DayIterationMeta
  ): UserDailyPlanUpdateData {
    return {
      isWorkoutDay: meta.isWorkoutDay,
      dayOfWeek: meta.dayOfWeek,
      weekNumber: meta.weekNumber,
      warmupId: plan.warmupId,
      mainWorkoutId: meta.isWorkoutDay ? plan.mainWorkoutId : null,
      mealPlanId: plan.mealPlanId ?? null,
      originalDailyPlanId: plan.id,
      warmupStepIndex: meta.warmupStepIndex,
      mainWorkoutStepIndex: meta.mainWorkoutStepIndex,
    }
  }

  /**
   * Генерирует планы для указанного диапазона дней
   */
  generatePlansForRange(
    context: GenerationContext,
    range: GenerationRange
  ): UserDailyPlanCreateData[] {
    return this.mapPlansForRange(context, range, (plan, meta) =>
      this.createUserDailyPlanData(context, plan, meta)
    )
  }

  /**
   * Генерирует данные для обновления существующих планов
   */
  generateUpdateDataForRange(
    context: GenerationContext,
    range: GenerationRange
  ): UserDailyPlanUpdateData[] {
    return this.mapPlansForRange(context, range, (plan, meta) =>
      this.createUserDailyPlanUpdateData(context, plan, meta)
    )
  }

  private mapPlansForRange<T>(
    context: GenerationContext,
    range: GenerationRange,
    mapFn: (plan: PrismaDailyPlan, meta: DayIterationMeta) => T
  ): T[] {
    const { mainWorkoutDays, warmupOnlyDays } =
      this.validationService.categorizePlans(context.course.dailyPlans)

    const result: T[] = []
    let mainWorkoutIndex = 0
    let warmupOnlyIndex = 0
    let warmupStepIndex = 0
    let mainWorkoutStepIndex = 0

    for (let dayIndex = range.startDay; dayIndex < range.endDay; dayIndex++) {
      const date = this.dateService.calculateDateForDay(
        context.enrollment.startDate,
        dayIndex
      )
      const dayOfWeek = this.dateService.getDayOfWeek(date)
      const isWorkoutDay =
        context.enrollment.selectedWorkoutDays.includes(dayOfWeek)
      const weekNumber = this.dateService.calculateWeekNumber(dayIndex)

      const {
        plan: selectedPlan,
        newMainWorkoutIndex,
        newWarmupOnlyIndex,
      } = this.validationService.getNextPlan(
        isWorkoutDay,
        mainWorkoutDays,
        warmupOnlyDays,
        mainWorkoutIndex,
        warmupOnlyIndex
      )

      mainWorkoutIndex = newMainWorkoutIndex
      warmupOnlyIndex = newWarmupOnlyIndex
      warmupStepIndex += 1

      let currentMainWorkoutStep: number | null = null
      if (selectedPlan.mainWorkoutId) {
        mainWorkoutStepIndex += 1
        currentMainWorkoutStep = mainWorkoutStepIndex
      }

      result.push(
        mapFn(selectedPlan, {
          dayIndex,
          date,
          dayOfWeek,
          isWorkoutDay,
          weekNumber,
          warmupStepIndex,
          mainWorkoutStepIndex: currentMainWorkoutStep,
        })
      )
    }

    return result
  }
}
