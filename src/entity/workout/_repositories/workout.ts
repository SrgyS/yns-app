import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { Workout} from '../_domain/types'
import { logger } from '@/shared/lib/logger'
import { Workout as PrismaWorkout, WorkoutType } from '@prisma/client'
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
      slug: prismaWorkout.slug,
      title: prismaWorkout.title,
      type: prismaWorkout.type,
      durationSec: (p?.durationSec ?? 0) as number,
      difficulty: prismaWorkout.difficulty,
      equipment: prismaWorkout.equipment,
      description: prismaWorkout.description,
      videoId: prismaWorkout.videoId,
      muscles: prismaWorkout.muscles,
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

  async getWorkoutBySlug(slug: string): Promise<Workout | null> {
    try {
      const workout = await dbClient.workout.findUnique({
        where: { slug },
      })

      return workout ? this.mapPrismaWorkoutToDomain(workout) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting workout by slug',
        slug,
        error,
      })
      throw new Error('Failed to get workout')
    }
  }

  async getWorkoutTypeById(id: string): Promise<WorkoutType | undefined> {
    try {
      const workout = await dbClient.workout.findUnique({
        where: { id },
        select: { type: true }
      })

      return workout ? workout.type : undefined
    } catch (error) {
      logger.error({
        msg: 'Error getting workout type by id',
        id,
        error,
      })
      return undefined
    }
  }
}