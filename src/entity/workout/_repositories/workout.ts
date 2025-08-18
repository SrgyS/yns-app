import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { Workout } from '../_domain/types'
import { logger } from '@/shared/lib/logger'
import { Workout as PrismaWorkout, WorkoutType } from '@prisma/client'

@injectable()
export class WorkoutRepository {
  private mapPrismaWorkoutToDomain(prismaWorkout: PrismaWorkout): Workout {
    return {
      id: prismaWorkout.id,
      slug: prismaWorkout.slug,
      title: prismaWorkout.title,
      type: prismaWorkout.type,
      durationMinutes: prismaWorkout.durationMinutes,
      difficulty: prismaWorkout.difficulty,
      equipment: prismaWorkout.equipment,
      description: prismaWorkout.description,
      videoUrl: prismaWorkout.videoUrl,
      muscles: prismaWorkout.muscles,
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