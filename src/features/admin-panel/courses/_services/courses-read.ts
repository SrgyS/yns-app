import { injectable } from 'inversify'
import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { dbClient } from '@/shared/lib/db'
import { CourseQueryInput, CourseUpsertInput, LookupQueryInput } from '../_schemas'

export type AdminCourseSummary = {
  id: string
  slug: string
  title: string
  contentType: 'FIXED_COURSE' | 'SUBSCRIPTION'
  draft: boolean
  showRecipes: boolean
  tariffs: {
    id: string
    access: 'paid'
    price: number | null
    durationDays: number | null
    feedback: boolean
  }[]
}

export type AdminDailyPlan = CourseUpsertInput['dailyPlans'][number] & {
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

export type AdminCourseDetail = Omit<CourseUpsertInput, 'dailyPlans'> & {
  id: string
  showRecipes?: boolean
  dailyPlans: AdminDailyPlan[]
}

export type WorkoutLookupItem = {
  id: string
  title: string
}

export type RecipeLookupItem = {
  id: string
  slug: string
  title: string
}

export type VideoMeta = {
  duration?: number
  progress?: number | null
  posterUrl?: string | null
}



@injectable()
export class CoursesReadService {
  async listCourses(): Promise<AdminCourseSummary[]> {
    const courses = await dbClient.course.findMany({
      include: { tariffs: true },
      orderBy: { title: 'asc' },
    })

    return courses.map(course => this.mapCourseSummary(course))
  }

  async findCourse(input: CourseQueryInput) {
    if (input.id) {
      return dbClient.course.findUnique({
        where: { id: input.id },
        include: {
          tariffs: true,
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
        tariffs: true,
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

  async lookupWorkouts(input: LookupQueryInput): Promise<WorkoutLookupItem[]> {
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

  async lookupRecipes(input: LookupQueryInput): Promise<RecipeLookupItem[]> {
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

  async getVideoMeta(videoId: string): Promise<VideoMeta | null> {
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

  async lookupMealPlans(input: LookupQueryInput) {
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
  }

  mapCourseSummary(
    course: Prisma.CourseGetPayload<{ include: { tariffs: true } }>
  ): AdminCourseSummary {
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      contentType: course.contentType,
      draft: course.draft,
      showRecipes: course.showRecipes ?? false,
      tariffs: course.tariffs.map(tariff => ({
        id: tariff.id,
        access: 'paid',
        price: tariff.price,
        durationDays: tariff.durationDays,
        feedback: tariff.feedback,
      })),
    }
  }

  mapCourseDetail(course: any): AdminCourseDetail {
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
      showRecipes: course.showRecipes ?? false,
      allowedWorkoutDaysPerWeek: allowedWorkoutDays,
      contentType: course.contentType ?? 'FIXED_COURSE',
      tariffs: course.tariffs?.map((tariff: any) => ({
        id: tariff.id,
        access: 'paid',
        price: tariff.price ?? undefined,
        durationDays: tariff.durationDays ?? undefined,
        feedback: tariff.feedback ?? false,
      })),
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
}
