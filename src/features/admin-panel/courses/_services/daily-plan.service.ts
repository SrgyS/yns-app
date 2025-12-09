import { injectable } from 'inversify'
import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { dbClient } from '@/shared/lib/db'
import { CourseUpsertInput, DailyPlanUpdateInput } from '../_schemas'
import { generateDaySlug } from './utils'


@injectable()
export class DailyPlanService {
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

  normalizeDailyPlans(
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

  async syncDailyPlans(
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
  
  private async resolveMealPlanBySlug(
    courseId: string,
    slug: string,
    tx: Prisma.TransactionClient
  ) {
    // This helper logic was originally in MealPlanService, but referenced here.
    // Ideally we should use MealPlanService here if possible, or duplicated/shared logic.
    // For now I'll duplicate the simple lookup to avoid circular dependency or complex passing.
    const mealPlan = await tx.mealPlan.findUnique({
        where: {
          courseId_slug: { courseId, slug },
        },
      })
    return mealPlan
  }
}
