import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { Workout } from '../_domain/types'
import { logger } from '@/shared/lib/logger'
import {
  Prisma,
  Workout as PrismaWorkout,
  WorkoutSection,
  WorkoutSubsection,
} from '@prisma/client'
import { PosterSchema } from '../_domain/schema'

@injectable()
export class WorkoutRepository {
  //TODO: убрать отсюда или упростить
  private toPoster(value: unknown): Record<string, string> | null {
    if (value == null) return null
    const parsed = PosterSchema.safeParse(value as any)
    if (parsed.success) return parsed.data
    if (typeof value === 'object' && !Array.isArray(value) && value) {
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === 'string') out[k] = v
      }
      return Object.keys(out).length ? out : null
    }
    return null
  }

  private mapPrismaWorkoutToDomain(prismaWorkout: PrismaWorkout): Workout {
    const p: any = prismaWorkout
    return {
      id: prismaWorkout.id,
      title: prismaWorkout.title,
      durationSec: (p?.durationSec ?? 0) as number,
      difficulty: prismaWorkout.difficulty,
      equipment: prismaWorkout.equipment,
      description: prismaWorkout.description,
      videoId: prismaWorkout.videoId,
      muscles: prismaWorkout.muscles,
      section: prismaWorkout.section,
      subsections: prismaWorkout.subsections,
      poster: this.toPoster(p?.poster as unknown),
      progress: (p?.progress ?? null) as number | null,
      posterUrl: (p?.posterUrl ?? null) as string | null,
    }
  }

  async getWorkoutById(id: string): Promise<Workout | null> {
    try {
      const workout = await dbClient.workout.findUnique({
        where: { id },
      })

      return workout ? this.mapPrismaWorkoutToDomain(workout) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting workout by id',
        id,
        error,
      })
      throw new Error('Failed to get workout')
    }
  }

  async listByIds(ids: string[]): Promise<Workout[]> {
    if (ids.length === 0) {
      return []
    }

    try {
      const workouts = await dbClient.workout.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      })

      return workouts.map(workout => this.mapPrismaWorkoutToDomain(workout))
    } catch (error) {
      logger.error({
        msg: 'Error listing workouts by ids',
        ids,
        error,
      })
      throw new Error('Failed to list workouts by ids')
    }
  }

  async listBySection(params: {
    section: WorkoutSection
    subsection?: WorkoutSubsection | null
    search?: string | null
    take?: number
    skip?: number
  }): Promise<Workout[]> {
    const { section, subsection, search, take, skip } = params

    const where: Prisma.WorkoutWhereInput = {
      section,
    }

    if (subsection) {
      where.subsections = { has: subsection }
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    try {
      const workouts = await dbClient.workout.findMany({
        where,
        orderBy: { title: 'asc' },
        take,
        skip,
      })

      return workouts.map(workout => this.mapPrismaWorkoutToDomain(workout))
    } catch (error) {
      logger.error({
        msg: 'Error listing workouts by section',
        params,
        error,
      })
      throw new Error('Failed to list workouts')
    }
  }
}
