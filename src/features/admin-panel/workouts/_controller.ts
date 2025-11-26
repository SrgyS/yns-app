import { TRPCError } from '@trpc/server'
import { Prisma, ROLE } from '@prisma/client'
import { injectable } from 'inversify'

import {
  Controller,
  checkAbilityProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { createAdminAbility } from '../users/_domain/ability'
import { StaffPermissionService } from '../users/_services/staff-permissions'
import {
  SyncInput,
  syncInputSchema,
  WorkoutIdInput,
  workoutIdSchema,
  WorkoutUpsertInput,
  workoutUpsertInputSchema,
  WorkoutListQuery,
  workoutListQuerySchema,
} from './_schemas'
import { SharedSession } from '@/kernel/domain/user'
import { dbClient } from '@/shared/lib/db'

type AdminWorkoutSummary = {
  id: string
  slug: string
  title: string
  videoId: string
  durationSec: number
  difficulty: string
  section: string
  needsReview: boolean
  manuallyEdited: boolean
  posterUrl?: string | null
  createdAt: string
}

type AdminWorkoutDetail = AdminWorkoutSummary & {
  description: string | null
  type: string
  subsections: string[]
  muscles: string[]
  equipment: string[]
  posterUrl?: string | null
  progress?: number | null
}

type SyncResult = {
  created: number
  updated: number
  skippedManual: number
  errors: string[]
}

type KinescopePoster = {
  original?: string
  md?: string
  sm?: string
  xs?: string
  [k: string]: unknown
}

type KinescopeVideo = {
  id: string
  title?: string
  description?: string | null
  duration?: number | null
  progress?: number | null
  poster?: KinescopePoster | null
  created_at?: string
}

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(?:^-+)|(?:-+$)/g, '') || 'video'

@injectable()
export class AdminWorkoutsController extends Controller {
  constructor(private readonly staffPermissionService: StaffPermissionService) {
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

  private readonly mapSummary = (workout: any): AdminWorkoutSummary => ({
    id: workout.id,
    slug: workout.slug,
    title: workout.title,
    videoId: workout.videoId ?? '',
    durationSec: workout.durationSec ?? 0,
    difficulty: workout.difficulty,
    section: workout.section,
    needsReview: workout.needsReview,
    manuallyEdited: workout.manuallyEdited,
    posterUrl: workout.posterUrl ?? null,
    createdAt: workout.lastSyncedAt ? workout.lastSyncedAt.toISOString() : '',
  })

  private readonly mapDetail = (workout: any): AdminWorkoutDetail => ({
    ...this.mapSummary(workout),
    description: workout.description ?? null,
    type: workout.type,
    subsections: workout.subsections ?? [],
    muscles: workout.muscles ?? [],
    equipment: workout.equipment ?? [],
    posterUrl: workout.posterUrl,
    progress: workout.progress ?? null,
  })

  private async getWorkout(input: WorkoutIdInput) {
    const workout = await dbClient.workout.findFirst({
      where: {
        OR: [
          input.id ? { id: input.id } : undefined,
          input.slug ? { slug: input.slug } : undefined,
        ].filter(Boolean) as any,
      },
    })

    if (!workout) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Тренировка не найдена',
      })
    }

    return workout
  }

  private async fetchKinescopeVideos(
    folderId?: string
  ): Promise<KinescopeVideo[]> {
    const apiKey = process.env.KINESCOPE_API_KEY
    if (!apiKey) {
      throw new TRPCError({
        code: 'SERVICE_UNAVAILABLE',
        message: 'отсутствует KINESCOPE_API_KEY',
      })
    }

    const perPage = 100
    let page = 1

    const all: KinescopeVideo[] = []

    while (true) {
      const searchParams = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        order: 'created_at.desc,title.asc',
      })
      const baseUrl = folderId
        ? `https://api.kinescope.io/v1/folders/${folderId}/videos`
        : 'https://api.kinescope.io/v1/videos'
      const url = `${baseUrl}?${searchParams.toString()}`

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      })

      if (!resp.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Не удалось получить список видео: ${resp.status} ${resp.statusText}`,
        })
      }

      const payload = await resp.json()
      const data: KinescopeVideo[] = payload.data ?? payload ?? []
      all.push(...data)

      const pagination =
        payload.meta?.pagination ?? payload.pagination ?? payload.meta

      const total = Number(pagination?.total ?? Number.NaN)
      const perPageResp = Number(pagination?.per_page ?? perPage)

      const hasMore =
        Number.isFinite(total) && Number.isFinite(perPageResp)
          ? page * perPageResp < total
          : data.length === perPageResp

      if (!hasMore) break
      page += 1
    }

    return all
  }

  private async syncFromKinescope(input: SyncInput): Promise<SyncResult> {
    const videos = await this.fetchKinescopeVideos(input.folderId)

    const now = new Date()

    const result: SyncResult = {
      created: 0,
      updated: 0,
      skippedManual: 0,
      errors: [],
    }

    for (const video of videos) {
      const slug = toSlug(`${video.title || 'video'}-${video.id}`)
      try {
        const existing = await dbClient.workout.findFirst({
          where: {
            OR: [{ videoId: video.id }, { slug }],
          },
        })

        const posterValue: Prisma.InputJsonValue | typeof Prisma.JsonNull =
          video.poster
            ? (video.poster as Prisma.InputJsonValue)
            : Prisma.JsonNull

        const mediaData = {
          title: video.title || slug,
          description: video.description ?? null,
          videoId: video.id,
          durationSec:
            typeof video.duration === 'number'
              ? Math.max(0, Math.round(video.duration))
              : 0,
          progress:
            typeof video.progress === 'number'
              ? Math.max(0, Math.round(video.progress))
              : null,
          poster: posterValue,
          posterUrl:
            (video.poster as KinescopePoster | undefined)?.original ?? null,
          lastSyncedAt:
            typeof video.created_at === 'string'
              ? new Date(video.created_at)
              : now,
        }

        if (!existing) {
          await dbClient.workout.create({
            data: {
              slug,
              type: 'CARDIO',
              section: 'FUNCTIONAL',
              subsections: [],
              muscles: [],
              equipment: [],
              difficulty: 'MEDIUM',
              needsReview: true,
              manuallyEdited: false,
              ...mediaData,
            },
          })
          result.created += 1
          continue
        }

        if (existing.manuallyEdited && !input.overwriteManuallyEdited) {
          result.skippedManual += 1
          continue
        }

        await dbClient.workout.update({
          where: { id: existing.id },
          data: {
            ...mediaData,
            needsReview: existing.needsReview,
            manuallyEdited: existing.manuallyEdited,
          },
        })
        result.updated += 1
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Неизвестная ошибка синка'
        result.errors.push(`Video ${video.id}: ${message}`)
      }
    }

    return result
  }

  private async listWorkouts(input: WorkoutListQuery): Promise<{
    items: AdminWorkoutSummary[]
    total: number
    page: number
    pageSize: number
  }> {
    const page = input.cursor ?? input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const skip = (page - 1) * pageSize

    // Prisma версии, используемой здесь, не поддерживает distinct в count,
    // поэтому считаем total через findMany + distinct, а затем paginated выборку отдельно.
    const [distinctVideoIds, workouts] = await Promise.all([
      dbClient.workout.findMany({
        select: { videoId: true },
        distinct: ['videoId'],
      }),
      dbClient.workout.findMany({
        orderBy: [
          { needsReview: 'desc' },
          { manuallyEdited: 'desc' },
          { title: 'asc' },
        ],
        distinct: ['videoId'],
        select: {
          id: true,
          slug: true,
          title: true,
          videoId: true,
          durationSec: true,
          difficulty: true,
          section: true,
          needsReview: true,
          manuallyEdited: true,
          posterUrl: true,
          lastSyncedAt: true,
        },
        skip,
        take: pageSize,
      }),
    ])
    const total = distinctVideoIds.length

    return {
      items: workouts.map(this.mapSummary),
      total,
      page,
      pageSize,
    }
  }

  private async upsertWorkout(
    input: WorkoutUpsertInput
  ): Promise<AdminWorkoutDetail> {
    const data = {
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      videoId: input.videoId,
      type: input.type,
      section: input.section,
      subsections: input.subsections ?? [],
      muscles: input.muscles ?? [],
      equipment: input.equipment ?? [],
      difficulty: input.difficulty,
      needsReview: false,
      manuallyEdited: true,
    }

    const workout = input.id
      ? await dbClient.workout.update({
          where: { id: input.id },
          data,
        })
      : await dbClient.workout.upsert({
          where: { slug: input.slug },
          update: data,
          create: data,
        })

    return this.mapDetail(workout)
  }

  public router = router({
    adminWorkouts: router({
      workouts: router({
        list: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(workoutListQuerySchema)
          .query(({ input }) => this.listWorkouts(input)),
        get: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(workoutIdSchema)
          .query(async ({ input }) => {
            const workout = await this.getWorkout(input)
            return this.mapDetail(workout)
          }),
        upsert: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(workoutUpsertInputSchema)
          .mutation(async ({ input }) => this.upsertWorkout(input)),
        sync: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(syncInputSchema)
          .mutation(async ({ input }) => this.syncFromKinescope(input)),
      }),
    }),
  })
}
