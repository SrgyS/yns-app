import { DayOfWeek, DailyPlan as PrismaDailyPlan } from '@prisma/client'
import { DateCalculationService } from './date-calculation'
import { PlanValidationService } from './plan-validation'

export interface GenerationContext {
  enrollment: {
    id: string
    userId: string
    startDate: Date
    selectedWorkoutDays: DayOfWeek[]
  }
  course: {
    durationWeeks: number
    minWorkoutDaysPerWeek: number
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
}

export interface UserDailyPlanUpdateData {
  isWorkoutDay: boolean
  dayOfWeek: DayOfWeek
  weekNumber: number
  warmupId: string
  mainWorkoutId: string | null
  mealPlanId: string | null
  originalDailyPlanId: string
}

export interface GenerationRange {
  startDay: number
  endDay: number
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
    durationWeeks: number
  ): GenerationRange {
    if (scope === 'full') {
      return {
        startDay: 0,
        endDay: durationWeeks * 7,
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
    dayIndex: number,
    plan: PrismaDailyPlan
  ): UserDailyPlanCreateData {
    const currentDate = this.dateService.calculateDateForDay(
      context.enrollment.startDate,
      dayIndex
    )
    const dayOfWeek = this.dateService.getDayOfWeek(currentDate)
    const isWorkoutDay = context.enrollment.selectedWorkoutDays.includes(dayOfWeek)
    const weekNumber = this.dateService.calculateWeekNumber(dayIndex)

    return {
      userId: context.enrollment.userId,
      enrollmentId: context.enrollment.id,
      date: currentDate,
      dayNumberInCourse: dayIndex + 1,
      weekNumber,
      dayOfWeek,
      isWorkoutDay,
      warmupId: plan.warmupId,
      mainWorkoutId: isWorkoutDay ? plan.mainWorkoutId : null,
      mealPlanId: plan.mealPlanId ?? null,
      originalDailyPlanId: plan.id,
    }
  }

  /**
   * Создает данные для обновления UserDailyPlan
   */
  createUserDailyPlanUpdateData(
    context: GenerationContext,
    dayIndex: number,
    plan: PrismaDailyPlan
  ): UserDailyPlanUpdateData {
    const currentDate = this.dateService.calculateDateForDay(
      context.enrollment.startDate,
      dayIndex
    )
    const dayOfWeek = this.dateService.getDayOfWeek(currentDate)
    const isWorkoutDay = context.enrollment.selectedWorkoutDays.includes(dayOfWeek)
    const weekNumber = this.dateService.calculateWeekNumber(dayIndex)

    return {
      isWorkoutDay,
      dayOfWeek,
      weekNumber,
      warmupId: plan.warmupId,
      mainWorkoutId: isWorkoutDay ? plan.mainWorkoutId : null,
      mealPlanId: plan.mealPlanId ?? null,
      originalDailyPlanId: plan.id,
    }
  }

  /**
   * Генерирует планы для указанного диапазона дней
   */
  generatePlansForRange(
    context: GenerationContext,
    range: GenerationRange
  ): UserDailyPlanCreateData[] {
    const { mainWorkoutDays, warmupOnlyDays } = this.validationService.categorizePlans(
      context.course.dailyPlans
    )

    const plans: UserDailyPlanCreateData[] = []
    let mainWorkoutIndex = 0
    let warmupOnlyIndex = 0

    for (let i = range.startDay; i < range.endDay; i++) {
      const currentDate = this.dateService.calculateDateForDay(
         context.enrollment.startDate,
         i
       )
      const dayOfWeek = this.dateService.getDayOfWeek(currentDate)
      const isWorkoutDay = context.enrollment.selectedWorkoutDays.includes(dayOfWeek)

      const { plan: selectedPlan, newMainWorkoutIndex, newWarmupOnlyIndex } = 
        this.validationService.getNextPlan(
          isWorkoutDay,
          mainWorkoutDays,
          warmupOnlyDays,
          mainWorkoutIndex,
          warmupOnlyIndex
        )

      mainWorkoutIndex = newMainWorkoutIndex
      warmupOnlyIndex = newWarmupOnlyIndex

      const planData = this.createUserDailyPlanData(context, i, selectedPlan)
      plans.push(planData)
    }

    return plans
  }

  /**
   * Генерирует данные для обновления существующих планов
   */
  generateUpdateDataForRange(
    context: GenerationContext,
    range: GenerationRange
  ): UserDailyPlanUpdateData[] {
    const { mainWorkoutDays, warmupOnlyDays } = this.validationService.categorizePlans(
      context.course.dailyPlans
    )

    const updateData: UserDailyPlanUpdateData[] = []
    let mainWorkoutIndex = 0
    let warmupOnlyIndex = 0

    for (let i = range.startDay; i < range.endDay; i++) {
      const currentDate = this.dateService.calculateDateForDay(
         context.enrollment.startDate,
         i
       )
      const dayOfWeek = this.dateService.getDayOfWeek(currentDate)
      const isWorkoutDay = context.enrollment.selectedWorkoutDays.includes(dayOfWeek)

      const { plan: selectedPlan, newMainWorkoutIndex, newWarmupOnlyIndex } = 
        this.validationService.getNextPlan(
          isWorkoutDay,
          mainWorkoutDays,
          warmupOnlyDays,
          mainWorkoutIndex,
          warmupOnlyIndex
        )

      mainWorkoutIndex = newMainWorkoutIndex
      warmupOnlyIndex = newWarmupOnlyIndex

      const updateData_ = this.createUserDailyPlanUpdateData(context, i, selectedPlan)
      updateData.push(updateData_)
    }

    return updateData
  }
}