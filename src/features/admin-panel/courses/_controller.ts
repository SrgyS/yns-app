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
} from './_schemas'
import { SharedSession } from '@/kernel/domain/user'
import { dbClient } from '@/shared/lib/db'

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

type AdminCourseDetail = CourseUpsertInput & { id: string }

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
    const role = session.user.role as ROLE
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
          warmupId: plan.warmup.id,
          mainWorkoutId: plan.mainWorkout?.id ?? null,
          mealPlanId: plan.mealPlan?.slug ?? null,
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
              warmup: { select: { id: true, title: true } },
              mainWorkout: { select: { id: true, title: true } },
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
            warmup: { select: { id: true, title: true } },
            mainWorkout: { select: { id: true, title: true } },
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

  private async upsertCourse(
    input: CourseUpsertInput
  ): Promise<AdminCourseDetail> {
    this.validateProduct(input)
    const allowedWorkoutDays = this.normalizeAllowedWorkoutDays(input)

    const course = await dbClient.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const productData =
          input.product.access === 'paid'
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

        const baseCourseData = {
          slug: input.slug,
          title: input.title,
          description: input.description,
          shortDescription: input.shortDescription ?? null,
          thumbnail: input.thumbnail,
          image: input.image,
          draft: input.draft,
          durationWeeks: input.durationWeeks,
          allowedWorkoutDaysPerWeek: allowedWorkoutDays,
          contentType: input.contentType,
        }

        const upsertedCourse = input.id
          ? await tx.course.update({
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
          : await tx.course.upsert({
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

        // Синхронизация зависимостей курсов
        const dependencyIds = input.dependencies ?? []
        await tx.courseDependency.deleteMany({
          where: {
            courseId: upsertedCourse.id,
            dependsOnId: { notIn: dependencyIds },
          },
        })
        if (dependencyIds.length > 0) {
          const existingDeps = await tx.courseDependency.findMany({
            where: {
              courseId: upsertedCourse.id,
              dependsOnId: { in: dependencyIds },
            },
            select: { dependsOnId: true },
          })
          const existingIds = new Set(existingDeps.map(dep => dep.dependsOnId))
          const toCreate = dependencyIds.filter(id => !existingIds.has(id))

          if (toCreate.length > 0) {
            await tx.courseDependency.createMany({
              data: toCreate.map(dependsOnId => ({
                courseId: upsertedCourse.id,
                dependsOnId,
              })),
            })
          }
        }

        // НЕДЕЛИ
        if (upsertedCourse.contentType === 'SUBSCRIPTION') {
          const weekNumbers = input.weeks.map(week => week.weekNumber)
          await tx.week.deleteMany({
            where: {
              courseId: upsertedCourse.id,
              weekNumber: { notIn: weekNumbers },
            },
          })

          for (const week of input.weeks) {
            await tx.week.upsert({
              where: {
                courseId_weekNumber: {
                  courseId: upsertedCourse.id,
                  weekNumber: week.weekNumber,
                },
              },
              update: {
                releaseAt: new Date(week.releaseAt),
              },
              create: {
                courseId: upsertedCourse.id,
                weekNumber: week.weekNumber,
                releaseAt: new Date(week.releaseAt),
              },
            })
          }
        } else {
          await tx.week.deleteMany({ where: { courseId: upsertedCourse.id } })
        }

        // ПЛАНЫ ПИТАНИЯ
        const mealPlanSlugs = input.mealPlans.map(plan => plan.slug)
        await tx.mealPlan.deleteMany({
          where: {
            courseId: upsertedCourse.id,
            slug: { notIn: mealPlanSlugs },
          },
        })

        for (const plan of input.mealPlans) {
          const breakfast = await this.resolveRecipeBySlug(
            plan.breakfastRecipeId,
            tx
          )
          const lunch = await this.resolveRecipeBySlug(plan.lunchRecipeId, tx)
          const dinner = await this.resolveRecipeBySlug(plan.dinnerRecipeId, tx)

          await tx.mealPlan.upsert({
            where: {
              courseId_slug: { courseId: upsertedCourse.id, slug: plan.slug },
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
              courseId: upsertedCourse.id,
              breakfastRecipeId: breakfast.id,
              lunchRecipeId: lunch.id,
              dinnerRecipeId: dinner.id,
            },
          })
        }

        // ДНЕВНЫЕ ПЛАНЫ
        const dailyPlanSlugs = input.dailyPlans.map(plan => plan.slug)
        await tx.dailyPlan.deleteMany({
          where: {
            courseId: upsertedCourse.id,
            slug: { notIn: dailyPlanSlugs },
          },
        })

        for (const plan of input.dailyPlans) {
          const warmup = await this.resolveWorkoutById(plan.warmupId, tx)
          const mainWorkout = plan.mainWorkoutId
            ? await this.resolveWorkoutById(plan.mainWorkoutId, tx)
            : null
          const mealPlan = plan.mealPlanId
            ? await this.resolveMealPlanBySlug(
                upsertedCourse.id,
                plan.mealPlanId,
                tx
              )
            : null

          const upsertedPlan = await tx.dailyPlan.upsert({
            where: {
              courseId_slug: {
                courseId: upsertedCourse.id,
                slug: plan.slug,
              },
            },
            update: {
              weekNumber: plan.weekNumber,
              dayNumberInWeek: plan.dayNumberInWeek,
              description: plan.description ?? null,
              warmupId: warmup.id,
              mainWorkoutId: mainWorkout ? mainWorkout.id : null,
              mealPlanId: mealPlan ? mealPlan.id : null,
            },
            create: {
              slug: plan.slug,
              courseId: upsertedCourse.id,
              weekNumber: plan.weekNumber,
              dayNumberInWeek: plan.dayNumberInWeek,
              description: plan.description ?? null,
              warmupId: warmup.id,
              mainWorkoutId: mainWorkout ? mainWorkout.id : null,
              mealPlanId: mealPlan ? mealPlan.id : null,
            },
          })

          await tx.contentBlock.deleteMany({
            where: { dailyPlanId: upsertedPlan.id },
          })

          if (plan.contentBlocks && plan.contentBlocks.length > 0) {
            await tx.contentBlock.createMany({
              data: plan.contentBlocks.map(block => ({
                type: block.type,
                text: block.text ?? null,
                dailyPlanId: upsertedPlan.id,
              })),
            })
          }
        }

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
        delete: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string().min(1) }))
          .mutation(async ({ ctx, input }) => {
            await this.deleteCourseService.exec(
              { id: input.id },
              ctx.ability
            )
            return { success: true }
          }),
        lookup: router({
          workouts: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(({ input }) => this.lookupWorkouts(input)),
          recipes: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(({ input }) => this.lookupRecipes(input)),
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
      }),
    }),
  })
}
