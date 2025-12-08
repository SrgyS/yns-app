import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { Prisma, ROLE } from '@prisma/client'
import { injectable } from 'inversify'

import {
  Controller,
  checkAbilityProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { createAdminAbility } from '../users/_domain/ability'
import { StaffPermissionService } from '../users/_services/staff-permissions'
import { DeleteCourseService } from '@/entities/course/_services/delete-course'
import {
  CourseQueryInput,
  courseQuerySchema,
  CourseUpsertInput,
  courseUpsertInputSchema,
  LookupQueryInput,
  lookupQuerySchema,
  dailyPlanUpdateSchema,
} from './_schemas'
import { SharedSession } from '@/kernel/domain/user'
import { dbClient } from '@/shared/lib/db'
import { PlanValidationService } from '@/entities/planning/_services/plan-validation'

type AdminCourseSummary = {
  id: string
  slug: string
  title: string
  contentType: 'FIXED_COURSE' | 'SUBSCRIPTION'
  draft: boolean
  product: {
    access: 'free' | 'paid'
    price?: number | null
    accessDurationDays?: number | null
  } | null
}
type AdminDailyPlan = CourseUpsertInput['dailyPlans'][number] & {
  warmupTitle?: string | null
  warmupDurationSec?: number | null
  warmupSection?: string | null
  mainWorkoutsMeta?: {
    workoutId: string
    title?: string | null
    durationSec?: number | null
    section?: string | null
    order: number
  }[]
}

type AdminCourseDetail = Omit<CourseUpsertInput, 'dailyPlans'> & {
  id: string
  dailyPlans: AdminDailyPlan[]
}

type WorkoutLookupItem = {
  id: string
  title: string
}

type RecipeLookupItem = {
  id: string
  slug: string
  title: string
}

type VideoMeta = {
  duration?: number
  progress?: number | null
  posterUrl?: string | null
}

const generateDaySlug = (weekNumber: number, dayNumber: number) =>
  `week-${weekNumber}-day-${dayNumber}`

@injectable()
export class AdminCoursesController extends Controller {
  constructor(
    private readonly staffPermissionService: StaffPermissionService,
    private readonly deleteCourseService: DeleteCourseService
  ) {
    super()
  }

  private ensureAdmin(role: ROLE) {
    if (role === 'ADMIN' || role === 'STAFF') {
      return
    }

    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  private readonly createAbility = async (session: SharedSession) => {
    const userRecord = await dbClient.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!userRecord) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Пользователь не найден',
      })
    }

    const role = userRecord.role
    this.ensureAdmin(role)

    const permissions = await this.staffPermissionService.getPermissionsForUser(
      {
        id: session.user.id,
        role,
      }
    )

    return createAdminAbility(session, permissions)
  }

  private readonly mapCourseSummary = (
    course: Prisma.CourseGetPayload<{ include: { product: true } }>
  ): AdminCourseSummary => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    contentType: course.contentType,
    draft: course.draft,
    product: course.product
      ? {
          access: course.product.access as 'free' | 'paid',
          price: course.product.price,
          accessDurationDays: course.product.accessDurationDays,
        }
      : null,
  })

  private readonly mapCourseDetail = (course: any): AdminCourseDetail => {
    const allowedWorkoutDays =
      course.allowedWorkoutDaysPerWeek &&
      course.allowedWorkoutDaysPerWeek.length > 0
        ? course.allowedWorkoutDaysPerWeek
        : [5]

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnail: course.thumbnail,
      image: course.image,
      draft: course.draft,
      durationWeeks: course.durationWeeks,
      allowedWorkoutDaysPerWeek: allowedWorkoutDays,
      contentType: course.contentType ?? 'FIXED_COURSE',
      product:
        course.product?.access === 'paid'
          ? {
              access: 'paid',
              price: course.product.price ?? 0,
              accessDurationDays: course.product.accessDurationDays ?? 0,
            }
          : { access: 'free' },
      dependencies: course.dependencies?.map((dep: any) => dep.id) ?? [],
      weeks:
        course.weeks?.map((week: any) => ({
          id: week.id,
          weekNumber: week.weekNumber,
          releaseAt: week.releaseAt.toISOString(),
        })) ?? [],
      mealPlans:
        course.mealPlans?.map((plan: any) => ({
          id: plan.id,
          slug: plan.slug,
          title: plan.title,
          description: plan.description,
          breakfastRecipeId: plan.breakfastRecipe.slug,
          lunchRecipeId: plan.lunchRecipe.slug,
          dinnerRecipeId: plan.dinnerRecipe.slug,
        })) ?? [],
      dailyPlans:
        course.dailyPlans?.map((plan: any) => ({
          id: plan.id,
          slug: plan.slug,
          weekNumber: plan.weekNumber,
          dayNumberInWeek: plan.dayNumberInWeek,
          description: plan.description,
          warmupId: plan.warmup?.id ?? '',
          warmupTitle: plan.warmup?.title ?? null,
          warmupDurationSec: plan.warmup?.durationSec ?? null,
          warmupSection: plan.warmup?.section ?? null,
          mealPlanId: plan.mealPlan?.slug ?? null,
          mainWorkouts:
            plan.mainWorkouts?.map((mw: any) => ({
              workoutId: mw.workout.id,
              order: mw.order,
            })) ?? [],
          mainWorkoutsMeta:
            plan.mainWorkouts?.map((mw: any) => ({
              workoutId: mw.workout.id,
              title: mw.workout.title ?? null,
              durationSec: mw.workout.durationSec ?? null,
              section: mw.workout.section ?? null,
              order: mw.order,
            })) ?? [],
          contentBlocks:
            plan.contentBlocks?.map((block: any) => ({
              id: block.id,
              type: block.type,
              text: block.text,
            })) ?? [],
        })) ?? [],
    }
  }

  private async getVideoMeta(videoId: string): Promise<VideoMeta | null> {
    const apiKey = process.env.KINESCOPE_API_KEY
    if (!apiKey) {
      throw new TRPCError({
        code: 'SERVICE_UNAVAILABLE',
        message: 'KINESCOPE_API_KEY is not configured',
      })
    }

    const response = await fetch(
      `https://api.kinescope.io/v1/videos/${videoId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Не удалось получить метаданные видео: ${response.status} ${response.statusText}`,
      })
    }

    const payload = await response.json()
    const data = payload.data ?? payload

    const duration =
      typeof data.duration === 'number' ? Math.round(data.duration) : undefined
    const progress =
      typeof data.progress === 'number' ? Math.round(data.progress) : null
    const posterUrl = data?.poster?.original ?? null

    return { duration, progress, posterUrl }
  }

  private async findCourse(input: CourseQueryInput) {
    if (input.id) {
      return dbClient.course.findUnique({
        where: { id: input.id },
        include: {
          product: true,
          dependencies: { select: { id: true } },
          weeks: { orderBy: { weekNumber: 'asc' } },
          mealPlans: {
            include: {
              breakfastRecipe: {
                select: { id: true, slug: true, title: true },
              },
              lunchRecipe: { select: { id: true, slug: true, title: true } },
              dinnerRecipe: { select: { id: true, slug: true, title: true } },
            },
            orderBy: { slug: 'asc' },
          },
          dailyPlans: {
            include: {
              warmup: {
                select: {
                  id: true,
                  title: true,
                  durationSec: true,
                  section: true,
                },
              },
              mainWorkouts: {
                orderBy: { order: 'asc' },
                include: {
                  workout: {
                    select: {
                      id: true,
                      title: true,
                      durationSec: true,
                      section: true,
                    },
                  },
                },
              },
              mealPlan: { select: { id: true, slug: true, title: true } },
              contentBlocks: true,
            },
            orderBy: [
              { weekNumber: 'asc' },
              { dayNumberInWeek: 'asc' },
              { slug: 'asc' },
            ],
          },
        },
      })
    }

    return dbClient.course.findUnique({
      where: { slug: input.slug! },
      include: {
        product: true,
        dependencies: { select: { id: true } },
        weeks: { orderBy: { weekNumber: 'asc' } },
        mealPlans: {
          include: {
            breakfastRecipe: { select: { id: true, slug: true, title: true } },
            lunchRecipe: { select: { id: true, slug: true, title: true } },
            dinnerRecipe: { select: { id: true, slug: true, title: true } },
          },
          orderBy: { slug: 'asc' },
        },
        dailyPlans: {
          include: {
            warmup: {
              select: {
                id: true,
                title: true,
                durationSec: true,
                section: true,
              },
            },
            mainWorkouts: {
              orderBy: { order: 'asc' },
              include: {
                workout: {
                  select: {
                    id: true,
                    title: true,
                    durationSec: true,
                    section: true,
                  },
                },
              },
            },
            mealPlan: { select: { id: true, slug: true, title: true } },
            contentBlocks: true,
          },
          orderBy: [
            { weekNumber: 'asc' },
            { dayNumberInWeek: 'asc' },
            { slug: 'asc' },
          ],
        },
      },
    })
  }

  private async lookupWorkouts(
    input: LookupQueryInput
  ): Promise<WorkoutLookupItem[]> {
    const search = input.search?.trim()
    const where: Prisma.WorkoutWhereInput = search
      ? {
          OR: [
            {
              title: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          ],
        }
      : {}

    const workouts = await dbClient.workout.findMany({
      where: { ...where, needsReview: false },
      select: { id: true, title: true },
      orderBy: [{ title: 'asc' }],
      take: input.take,
    })

    return workouts
  }

  private async lookupRecipes(
    input: LookupQueryInput
  ): Promise<RecipeLookupItem[]> {
    const search = input.search?.trim()
    const where: Prisma.RecipeWhereInput = search
      ? {
          OR: [
            {
              title: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
            { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}

    const recipes = await dbClient.recipe.findMany({
      where,
      select: { id: true, slug: true, title: true },
      orderBy: [{ title: 'asc' }, { slug: 'asc' }],
      take: input.take,
    })

    return recipes
  }

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
      !input.id &&
      !hasManualDailyPlans &&
      weeksInput.length > 0
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
    const weekNumbers = weeksInput.map(week => week.weekNumber)
    if (weekNumbers.length > 0) {
      await tx.dailyPlan.deleteMany({
        where: {
          courseId,
          weekNumber: { notIn: weekNumbers },
        },
      })
    } else {
      await tx.dailyPlan.deleteMany({ where: { courseId } })
    }

    await tx.week.deleteMany({
      where: {
        courseId,
        weekNumber: { notIn: weekNumbers },
      },
    })

    for (const week of weeksInput) {
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

  private async syncDailyPlans(
    tx: Prisma.TransactionClient,
    courseId: string,
    dailyPlans: CourseUpsertInput['dailyPlans'],
    shouldPruneAutoPlans: boolean,
    durationWeeks: number
  ) {
    const dailyPlanSlugs = dailyPlans.map(plan => plan.slug)
    await this.pruneDailyPlans(
      tx,
      courseId,
      dailyPlanSlugs,
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

  private async upsertCourse(
    input: CourseUpsertInput
  ): Promise<AdminCourseDetail> {
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
          input.durationWeeks
        )

        return upsertedCourse
      }
    )

    const updatedCourse = await this.findCourse({ id: course.id })
    if (!updatedCourse) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Course not found after upsert',
      })
    }

    return this.mapCourseDetail(updatedCourse)
  }

  public router = router({
    adminCourses: router({
      course: router({
        list: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        }).query(async () => {
          const courses = await dbClient.course.findMany({
            include: { product: true },
            orderBy: { title: 'asc' },
          })

          return courses.map(course => this.mapCourseSummary(course))
        }),
        get: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(courseQuerySchema)
          .query(async ({ input }) => {
            const course = await this.findCourse(input)
            if (!course) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Курс не найден',
              })
            }

            return this.mapCourseDetail(course)
          }),
        upsert: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(courseUpsertInputSchema)
          .mutation(async ({ input }) => {
            const result = await this.upsertCourse(input)
            return result
          }),
        setDraft: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string().min(1), draft: z.boolean() }))
          .mutation(async ({ input }) => {
            if (!input.draft) {
              const course = await dbClient.course.findUnique({
                where: { id: input.id },
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
              const validation = validator.validateCoursePlans(
                course,
                relevantPlans
              )
              if (!validation.isValid) {
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: validation.errors.join('; '),
                })
              }
            }

            const updated = await dbClient.course.update({
              where: { id: input.id },
              data: { draft: input.draft },
              select: { id: true, draft: true },
            })
            return updated
          }),
        delete: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string().min(1) }))
          .mutation(async ({ ctx, input }) => {
            await this.deleteCourseService.exec({ id: input.id }, ctx.ability)
            return { success: true }
          }),
        lookup: router({
          workouts: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(async ({ input }) => ({
              items: await this.lookupWorkouts(input),
            })),
          recipes: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(async ({ input }) => ({
              items: await this.lookupRecipes(input),
            })),
          mealPlans: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(async ({ input }) => {
              const items = await dbClient.mealPlan.findMany({
                where: {
                  OR: [
                    { title: { contains: input.search, mode: 'insensitive' } },
                    { slug: { contains: input.search, mode: 'insensitive' } },
                  ],
                },
                select: { id: true, slug: true, title: true },
                take: input.take ?? 20,
                orderBy: { slug: 'asc' },
              })
              return { items }
            }),
        }),
        videoMeta: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ videoId: z.string().min(1) }))
          .query(async ({ input }) => {
            const meta = await this.getVideoMeta(input.videoId)
            return meta
          }),
        dailyPlan: router({
          update: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(dailyPlanUpdateSchema)
            .mutation(async ({ input }) => {
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

          // mainWorkouts валидируются ниже при сохранении
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
            }),
        }),
      }),
    }),
  })
}
