import { injectable } from 'inversify'
import { WorkoutRepository } from '../_repositories/workout'
import { Workout } from '../_domain/types'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetWorkoutService {
  constructor(private workoutRepository: WorkoutRepository) {}

  async getById(id: string): Promise<Workout | null> {
    try {
      const workout = await this.workoutRepository.getWorkoutById(id)

      if (workout) {
        logger.info({
          msg: 'Successfully retrieved workout by id',
          id,
          workoutId: workout.id,
        })
      }

      return workout
    } catch (error) {
      logger.error({
        msg: 'Error getting workout by id',
        id,
        error,
      })
      throw new Error('Failed to get workout')
    }
  }

  async getBySlug(slug: string): Promise<Workout | null> {
    try {
      const workout = await this.workoutRepository.getWorkoutBySlug(slug)

      if (workout) {
        logger.info({
          msg: 'Successfully retrieved workout by slug',
          slug,
          workoutId: workout.id,
        })
      }

      return workout
    } catch (error) {
      logger.error({
        msg: 'Error getting workout by slug',
        slug,
        error,
      })
      throw new Error('Failed to get workout')
    }
  }
}
