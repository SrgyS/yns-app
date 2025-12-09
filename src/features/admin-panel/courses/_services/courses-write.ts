import { injectable } from 'inversify'
import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { dbClient } from '@/shared/lib/db'
import {
  CourseUpsertInput,
  DailyPlanUpdateInput,
} from '../_schemas'
import { PlanValidationService } from '@/entities/planning/_services/plan-validation'

const generateDaySlug = (weekNumber: number, dayNumber: number) =>
  `week-${weekNumber}-day-${dayNumber}`

@injectable()
export class CoursesWriteService {
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

        const normalizedDailyPlans = this.normalizeDailyPlans(
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
        await this.syncDependencies(tx, upsertedCourse.id, dependencyIds)

        await this.syncWeeks(tx, upsertedCourse.id, weeksInput)
        await this.syncMealPlans(tx, upsertedCourse.id, input.mealPlans)
        await this.syncDailyPlans(
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
    const existing = await dbClient.dailyPlan.findUnique({
      where: { id: input.id },
      select: { id: true },
    })

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'День плана не найден',
      })
    }

    const warmup = await dbClient.workout.findUnique({
      where: { id: input.warmupId },
      select: { id: true },
    })
    if (!warmup) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Указанная разминка не найдена',
      })
    }

    if (input.mainWorkouts?.length) {
      for (const mw of input.mainWorkouts) {
        const main = await dbClient.workout.findUnique({
          where: { id: mw.workoutId },
          select: { id: true },
        })
        if (!main) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Указанная основная тренировка не найдена',
          })
        }
      }
    }

    if (input.mealPlanId) {
      const dailyPlan = await dbClient.dailyPlan.findUnique({
        where: { id: input.id },
        select: { courseId: true },
      })

      if (!dailyPlan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'День плана не найден',
        })
      }

      const mealPlan = await dbClient.mealPlan.findUnique({
        where: {
          courseId_slug: {
            courseId: dailyPlan.courseId,
            slug: input.mealPlanId,
          },
        },
        select: { id: true },
      })
      if (!mealPlan) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'План питания не найден',
        })
      }
    }

    const updated = await dbClient.dailyPlan.update({
      where: { id: input.id },
      data: {
        description: input.description ?? null,
        warmupId: input.warmupId,
        mealPlanId: input.mealPlanId ?? null,
      },
      select: {
        id: true,
        warmupId: true,
        mealPlanId: true,
        description: true,
        weekNumber: true,
        dayNumberInWeek: true,
      },
    })
    await dbClient.dailyPlanMainWorkout.deleteMany({
      where: { dailyPlanId: updated.id },
    })
    if (input.mainWorkouts?.length) {
      await dbClient.dailyPlanMainWorkout.createMany({
        data: input.mainWorkouts.map(mw => ({
          dailyPlanId: updated.id,
          workoutId: mw.workoutId,
          order: mw.order,
        })),
      })
    }

    return updated
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

  private normalizeDailyPlans(
    dailyPlans: CourseUpsertInput['dailyPlans'],
    weeksInput: CourseUpsertInput['weeks'],
    durationWeeks: number
  ): CourseUpsertInput['dailyPlans'] {
    const allowedWeekNumbers =
      weeksInput.length > 0
        ? new Set(weeksInput.map(week => week.weekNumber))
        : new Set(Array.from({ length: durationWeeks }, (_v, idx) => idx + 1))

    const seen = new Set<string>()

    return dailyPlans
      .filter(plan => {
        const validWeek =
          allowedWeekNumbers.has(plan.weekNumber) &&
          plan.weekNumber <= durationWeeks
        const validDay =
          typeof plan.dayNumberInWeek === 'number' &&
          plan.dayNumberInWeek >= 1 &&
          plan.dayNumberInWeek <= 7
        return validWeek && validDay
      })
      .filter(plan => {
        const key = `${plan.weekNumber}-${plan.dayNumberInWeek}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => {
        if (a.weekNumber === b.weekNumber) {
          return a.dayNumberInWeek - b.dayNumberInWeek
        }
        return a.weekNumber - b.weekNumber
      })
      .map(plan => ({
        ...plan,
        mainWorkouts:
          plan.mainWorkouts && plan.mainWorkouts.length > 0
            ? plan.mainWorkouts
            : [],
      }))
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

  private async syncDependencies(
    tx: Prisma.TransactionClient,
    courseId: string,
    dependencyIds: string[]
  ) {
    await tx.courseDependency.deleteMany({
      where: {
        courseId,
        dependsOnId: { notIn: dependencyIds },
      },
    })

    if (dependencyIds.length === 0) return

    const existingDeps = await tx.courseDependency.findMany({
      where: {
        courseId,
        dependsOnId: { in: dependencyIds },
      },
      select: { dependsOnId: true },
    })
    const existingIds = new Set(existingDeps.map(dep => dep.dependsOnId))
    const toCreate = dependencyIds.filter(id => !existingIds.has(id))

    if (toCreate.length > 0) {
      await tx.courseDependency.createMany({
        data: toCreate.map(dependsOnId => ({
          courseId,
          dependsOnId,
        })),
      })
    }
  }

  private async syncWeeks(
    tx: Prisma.TransactionClient,
    courseId: string,
    weeksInput: CourseUpsertInput['weeks']
  ) {
    const existingWeeks = await tx.week.findMany({
      where: { courseId },
      select: { weekNumber: true },
    })
    const existingWeekNumbers = existingWeeks.map(week => week.weekNumber)
    const weekNumbers = weeksInput.map(week => week.weekNumber)

    const removedWeeks = this.collectRemovedWeeks(
      existingWeekNumbers,
      weekNumbers,
      weeksInput
    )

    await this.pruneUserPlansByWeeks(tx, courseId, removedWeeks)
    await this.pruneDailyPlansAndWeeks(tx, courseId, weekNumbers)

    for (const week of weeksInput) {
      await this.upsertWeekWithDays(tx, courseId, week)
    }
  }

  private collectRemovedWeeks(
    existingWeekNumbers: number[],
    weekNumbers: number[],
    weeksInput: CourseUpsertInput['weeks']
  ): Set<number> {
    const removed = new Set(
      weekNumbers.length > 0
        ? existingWeekNumbers.filter(week => !weekNumbers.includes(week))
        : existingWeekNumbers
    )
    const unpublishedWeeks = weeksInput
      .filter(week => week.releaseAt && new Date(week.releaseAt) > new Date())
      .map(week => week.weekNumber)
    for (const week of unpublishedWeeks) {
      removed.add(week)
    }
    return removed
  }

  private async pruneUserPlansByWeeks(
    tx: Prisma.TransactionClient,
    courseId: string,
    weeks: Set<number>
  ) {
    if (weeks.size === 0) return
    await tx.userDailyPlan.deleteMany({
      where: {
        weekNumber: { in: Array.from(weeks) },
        enrollment: { courseId },
      },
    })
  }

  private async pruneDailyPlansAndWeeks(
    tx: Prisma.TransactionClient,
    courseId: string,
    weekNumbers: number[]
  ) {
    if (weekNumbers.length > 0) {
      await tx.dailyPlan.deleteMany({
        where: {
          courseId,
          weekNumber: { notIn: weekNumbers },
        },
      })
      await tx.week.deleteMany({
        where: {
          courseId,
          weekNumber: { notIn: weekNumbers },
        },
      })
      return
    }

    await tx.dailyPlan.deleteMany({ where: { courseId } })
    await tx.week.deleteMany({ where: { courseId } })
  }

  private async upsertWeekWithDays(
    tx: Prisma.TransactionClient,
    courseId: string,
    week: CourseUpsertInput['weeks'][number]
  ) {
    await tx.week.upsert({
      where: {
        courseId_weekNumber: {
          courseId,
          weekNumber: week.weekNumber,
        },
      },
      update: {
        releaseAt: week.releaseAt ? new Date(week.releaseAt) : new Date(),
      },
      create: {
        courseId,
        weekNumber: week.weekNumber,
        releaseAt: week.releaseAt ? new Date(week.releaseAt) : new Date(),
      },
    })

    const existingPlans = await tx.dailyPlan.findMany({
      where: { courseId, weekNumber: week.weekNumber },
      select: { dayNumberInWeek: true },
    })
    const existingDayNumbers = new Set(
      existingPlans.map(plan => plan.dayNumberInWeek)
    )
    const toCreate: { dayNumberInWeek: number; slug: string }[] = []
    for (let day = 1; day <= 7; day += 1) {
      if (!existingDayNumbers.has(day)) {
        toCreate.push({
          dayNumberInWeek: day,
          slug: generateDaySlug(week.weekNumber, day),
        })
      }
    }
    if (toCreate.length > 0) {
      await tx.dailyPlan.createMany({
        data: toCreate.map(day => ({
          courseId,
          weekNumber: week.weekNumber,
          dayNumberInWeek: day.dayNumberInWeek,
          slug: day.slug,
          description: null,
          warmupId: null,
          mealPlanId: null,
        })),
      })
    }
  }

  private async syncMealPlans(
    tx: Prisma.TransactionClient,
    courseId: string,
    mealPlans: CourseUpsertInput['mealPlans']
  ) {
    const mealPlanSlugs = mealPlans.map(plan => plan.slug)
    await tx.mealPlan.deleteMany({
      where: {
        courseId,
        slug: { notIn: mealPlanSlugs },
      },
    })

    for (const plan of mealPlans) {
      const breakfast = await this.resolveRecipeBySlug(
        plan.breakfastRecipeId,
        tx
      )
      const lunch = await this.resolveRecipeBySlug(plan.lunchRecipeId, tx)
      const dinner = await this.resolveRecipeBySlug(plan.dinnerRecipeId, tx)

      await tx.mealPlan.upsert({
        where: {
          courseId_slug: { courseId, slug: plan.slug },
        },
        update: {
          title: plan.title,
          description: plan.description ?? null,
          breakfastRecipeId: breakfast.id,
          lunchRecipeId: lunch.id,
          dinnerRecipeId: dinner.id,
        },
        create: {
          slug: plan.slug,
          title: plan.title,
          description: plan.description ?? null,
          courseId,
          breakfastRecipeId: breakfast.id,
          lunchRecipeId: lunch.id,
          dinnerRecipeId: dinner.id,
        },
      })
    }
  }

  private async syncDailyPlans(
    tx: Prisma.TransactionClient,
    courseId: string,
    dailyPlans: CourseUpsertInput['dailyPlans'],
    shouldPruneAutoPlans: boolean,
    durationWeeks: number,
    weeksInput: CourseUpsertInput['weeks']
  ) {
    const dailyPlanSlugs = new Set(dailyPlans.map(plan => plan.slug))
    for (const week of weeksInput) {
      for (const day of [1, 2, 3, 4, 5, 6, 7]) {
        dailyPlanSlugs.add(generateDaySlug(week.weekNumber, day))
      }
    }
    const slugsArray = Array.from(dailyPlanSlugs)
    await this.pruneDailyPlans(
      tx,
      courseId,
      slugsArray,
      shouldPruneAutoPlans,
      durationWeeks
    )

    for (const plan of dailyPlans) {
      const upsertedPlan = await this.upsertDailyPlan(tx, courseId, plan)
      const mainWorkouts = (plan.mainWorkouts ?? []).sort(
        (a, b) => a.order - b.order
      )
      await tx.dailyPlanMainWorkout.deleteMany({
        where: { dailyPlanId: upsertedPlan.id },
      })
      if (mainWorkouts.length) {
        await tx.dailyPlanMainWorkout.createMany({
          data: mainWorkouts.map(mw => ({
            dailyPlanId: upsertedPlan.id,
            workoutId: mw.workoutId,
            order: mw.order,
          })),
        })
      }
      await this.syncContentBlocks(tx, upsertedPlan.id, plan.contentBlocks)
    }
  }

  private async pruneDailyPlans(
    tx: Prisma.TransactionClient,
    courseId: string,
    dailyPlanSlugs: string[],
    shouldPruneAutoPlans: boolean,
    durationWeeks: number
  ) {
    if (dailyPlanSlugs.length > 0) {
      await tx.dailyPlan.deleteMany({
        where: {
          courseId,
          slug: { notIn: dailyPlanSlugs },
        },
      })
      return
    }

    if (shouldPruneAutoPlans) {
      await tx.dailyPlan.deleteMany({
        where: {
          courseId,
          weekNumber: { gt: durationWeeks },
        },
      })
    }
  }

  private async upsertDailyPlan(
    tx: Prisma.TransactionClient,
    courseId: string,
    plan: CourseUpsertInput['dailyPlans'][number]
  ) {
    const warmupId = plan.warmupId
    const warmup = warmupId
      ? await this.resolveWorkoutById(warmupId, tx)
      : null
    const mealPlan = plan.mealPlanId
      ? await this.resolveMealPlanBySlug(courseId, plan.mealPlanId, tx)
      : null

    return tx.dailyPlan.upsert({
      where: {
        courseId_slug: {
          courseId,
          slug: plan.slug,
        },
      },
      update: {
        weekNumber: plan.weekNumber,
        dayNumberInWeek: plan.dayNumberInWeek,
        description: plan.description ?? null,
        warmupId: warmup ? warmup.id : null,
        mealPlanId: mealPlan ? mealPlan.id : null,
      },
      create: {
        slug: plan.slug,
        courseId,
        weekNumber: plan.weekNumber,
        dayNumberInWeek: plan.dayNumberInWeek,
        description: plan.description ?? null,
        warmupId: warmup ? warmup.id : null,
        mealPlanId: mealPlan ? mealPlan.id : null,
      },
    })
  }

  private async syncContentBlocks(
    tx: Prisma.TransactionClient,
    dailyPlanId: string,
    contentBlocks: CourseUpsertInput['dailyPlans'][number]['contentBlocks']
  ) {
    await tx.contentBlock.deleteMany({
      where: { dailyPlanId },
    })

    if (contentBlocks && contentBlocks.length > 0) {
      await tx.contentBlock.createMany({
        data: contentBlocks.map(block => ({
          type: block.type,
          text: block.text ?? null,
          dailyPlanId,
        })),
      })
    }
  }

  private async resolveWorkoutById(id: string, tx: Prisma.TransactionClient) {
    const workout = await tx.workout.findUnique({ where: { id } })
    if (!workout || workout.needsReview) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Тренировка не готова к использованию или не найдена`,
      })
    }
    return workout
  }

  private async resolveRecipeBySlug(
    slug: string,
    tx: Prisma.TransactionClient
  ) {
    const recipe = await tx.recipe.findUnique({ where: { slug } })
    if (!recipe) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Рецепт со slug "${slug}" не найден`,
      })
    }
    return recipe
  }

  private async resolveMealPlanBySlug(
    courseId: string,
    slug: string,
    tx: Prisma.TransactionClient
  ) {
    const mealPlan = await tx.mealPlan.findUnique({
      where: {
        courseId_slug: { courseId, slug },
      },
    })
    if (!mealPlan) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `План питания "${slug}" не найден для курса`,
      })
    }
    return mealPlan
  }
}
