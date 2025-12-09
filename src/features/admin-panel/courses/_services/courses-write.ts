import { injectable, inject } from 'inversify'
import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { dbClient } from '@/shared/lib/db'
import {
  CourseUpsertInput,
  DailyPlanUpdateInput,
} from '../_schemas'
import { PlanValidationService } from '@/entities/planning/_services/plan-validation'
import { CourseDependencyService } from './course-dependency.service'
import { CourseWeekService } from './course-week.service'
import { DailyPlanService } from './daily-plan.service'
import { MealPlanService } from './meal-plan.service'

@injectable()
export class CoursesWriteService {
  constructor(
    @inject(CourseDependencyService) private dependencyService: CourseDependencyService,
    @inject(CourseWeekService) private weekService: CourseWeekService,
    @inject(DailyPlanService) private dailyPlanService: DailyPlanService,
    @inject(MealPlanService) private mealPlanService: MealPlanService
  ) {}

  async upsertCourse(input: CourseUpsertInput) {
    this.validateProduct(input)
    const allowedWorkoutDays = this.normalizeAllowedWorkoutDays(input)
    const hasManualWeeks = input.weeks.length > 0
    const hasManualDailyPlans = input.dailyPlans.length > 0

    const course = await dbClient.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const { weeksInput, dailyPlansInput, shouldPruneAutoPlans } =
          await this.preparePlanInputs(
            tx,
            input,
            hasManualWeeks,
            hasManualDailyPlans
          )

        const normalizedDailyPlans = this.dailyPlanService.normalizeDailyPlans(
          dailyPlansInput,
          weeksInput,
          input.durationWeeks
        )

        const productData = this.buildProductData(input)

        const baseCourseData = {
          slug: input.slug,
          title: input.title,
          description: input.description ?? '',
          shortDescription: input.shortDescription ?? null,
          thumbnail: input.thumbnail ?? '',
          image: input.image ?? '',
          draft: input.draft,
          durationWeeks: input.durationWeeks,
          allowedWorkoutDaysPerWeek: allowedWorkoutDays,
          contentType: input.contentType,
        }

        const upsertedCourse = await this.upsertCourseRecord(
          tx,
          input,
          baseCourseData,
          productData
        )

        const dependencyIds = input.dependencies ?? []
        await this.dependencyService.syncDependencies(tx, upsertedCourse.id, dependencyIds)

        await this.weekService.syncWeeks(tx, upsertedCourse.id, weeksInput)
        await this.mealPlanService.syncMealPlans(tx, upsertedCourse.id, input.mealPlans)
        await this.dailyPlanService.syncDailyPlans(
          tx,
          upsertedCourse.id,
          normalizedDailyPlans,
          shouldPruneAutoPlans,
          input.durationWeeks,
          weeksInput
        )

        return upsertedCourse
      }
    )

    return course
  }

  async setDraft(id: string, draft: boolean) {
    if (!draft) {
      const course = await dbClient.course.findUnique({
        where: { id },
        include: {
          dailyPlans: {
            include: { mainWorkouts: true },
          },
        },
      })

      if (!course) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Курс не найден',
        })
      }

      const totalDays = course.durationWeeks * 7
      const relevantPlans = course.dailyPlans.filter(
        plan => plan.weekNumber <= course.durationWeeks
      )
      if (relevantPlans.length !== totalDays) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Для публикации требуется заполнить ${totalDays} дней. Сейчас: ${relevantPlans.length}.`,
        })
      }

      const validator = new PlanValidationService()
      const validation = validator.validateCoursePlans(course, relevantPlans)
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errors.join('; '),
        })
      }
    }

    return dbClient.course.update({
      where: { id },
      data: { draft },
      select: { id: true, draft: true },
    })
  }

  async updateDailyPlan(input: DailyPlanUpdateInput) {
    return this.dailyPlanService.updateDailyPlan(input)
  }

  // --- Private Helpers ---

  private validateProduct(input: CourseUpsertInput) {
    if (input.product.access === 'free') {
      return
    }

    if (!Number.isInteger(input.product.price) || input.product.price < 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Для платного курса требуется целочисленная цена >= 1',
      })
    }

    if (
      !Number.isInteger(input.product.accessDurationDays) ||
      input.product.accessDurationDays < 1
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Для платного курса требуется положительное целое accessDurationDays',
      })
    }
  }

  private normalizeAllowedWorkoutDays(input: CourseUpsertInput) {
    if (
      Array.isArray(input.allowedWorkoutDaysPerWeek) &&
      input.allowedWorkoutDaysPerWeek.length > 0
    ) {
      return input.allowedWorkoutDaysPerWeek
    }
    return [5]
  }

  private async preparePlanInputs(
    tx: Prisma.TransactionClient,
    input: CourseUpsertInput,
    hasManualWeeks: boolean,
    hasManualDailyPlans: boolean
  ) {
    const defaultWarmup = input.dailyPlans?.[0]?.warmupId ?? null

    const generatedWeeks =
      !hasManualWeeks && input.durationWeeks
        ? Array.from({ length: input.durationWeeks }).map((_v, idx) => ({
            weekNumber: idx + 1,
            releaseAt: new Date().toISOString(),
          }))
        : []

    const weeksInput = hasManualWeeks ? input.weeks : generatedWeeks

    const generateDaySlug = (weekNumber: number, dayNumber: number) =>
      `week-${weekNumber}-day-${dayNumber}`

    const generatedDailyPlans =
      !input.id && !hasManualDailyPlans && weeksInput.length > 0
        ? weeksInput.flatMap(week =>
            Array.from({ length: 7 }).map((_v, idx) => ({
              slug: generateDaySlug(week.weekNumber, idx + 1),
              weekNumber: week.weekNumber,
              dayNumberInWeek: idx + 1,
              description: null,
              warmupId: defaultWarmup,
              mainWorkouts: [],
              mealPlanId: null,
              contentBlocks: [],
            }))
          )
        : []

    const normalizeMainWorkouts = (
      plans: CourseUpsertInput['dailyPlans']
    ): CourseUpsertInput['dailyPlans'] => {
      return plans.map(plan => {
        const mainWorkouts =
          plan.mainWorkouts && plan.mainWorkouts.length > 0
            ? plan.mainWorkouts
            : []
        return {
          ...plan,
          mainWorkouts,
          warmupId: plan.warmupId ?? defaultWarmup ?? null,
        }
      })
    }

    const dailyPlansInput = normalizeMainWorkouts(
      hasManualDailyPlans ? input.dailyPlans : generatedDailyPlans
    )

    const shouldPruneAutoPlans =
      !hasManualDailyPlans &&
      Boolean(input.id) &&
      generatedDailyPlans.length === 0

    return { weeksInput, dailyPlansInput, shouldPruneAutoPlans }
  }

  private buildProductData(input: CourseUpsertInput) {
    return input.product.access === 'paid'
      ? {
          access: 'paid' as const,
          price: input.product.price,
          accessDurationDays: input.product.accessDurationDays,
        }
      : {
          access: 'free' as const,
          price: null,
          accessDurationDays: null,
        }
  }

  private async upsertCourseRecord(
    tx: Prisma.TransactionClient,
    input: CourseUpsertInput,
    baseCourseData: {
      slug: string
      title: string
      description: string
      shortDescription: string | null
      thumbnail: string
      image: string
      draft: boolean
      durationWeeks: number
      allowedWorkoutDaysPerWeek: number[]
      contentType: CourseUpsertInput['contentType']
    },
    productData: ReturnType<typeof this.buildProductData>
  ) {
    return input.id
      ? tx.course.update({
          where: { id: input.id },
          data: {
            ...baseCourseData,
            product: {
              upsert: {
                update: productData,
                create: productData,
              },
            },
          },
          include: { product: true },
        })
      : tx.course.upsert({
          where: { slug: input.slug },
          update: {
            ...baseCourseData,
            product: {
              upsert: {
                update: productData,
                create: productData,
              },
            },
          },
          create: {
            ...baseCourseData,
            product: { create: productData },
          },
          include: { product: true },
        })
  }
}
