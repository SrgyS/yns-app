import { injectable } from 'inversify'

import { WorkoutRepository } from '../_repositories/workout'
import { Workout } from '../_domain/types'
import { logger } from '@/shared/lib/logger'

@injectable()
export class ListWorkoutsByIdsService {
  constructor(private readonly workoutRepository: WorkoutRepository) {}

  async exec(ids: string[]): Promise<Workout[]> {
    if (ids.length === 0) {
      return []
    }

    try {
      const workouts = await this.workoutRepository.listByIds(ids)
      const order = new Map(ids.map((id, index) => [id, index]))

      return workouts
        .filter(workout => order.has(workout.id))
        .sort(
          (a, b) =>
            (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
        )
    } catch (error) {
      logger.error({
        msg: '[ListWorkoutsByIdsService] Failed to list workouts',
        ids,
        error,
      })
      throw error instanceof Error
        ? error
        : new Error('Failed to list workouts by ids')
    }
  }
}
