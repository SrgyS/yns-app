import { injectable } from 'inversify'

import type { UserId } from '@/kernel/domain/user'
import { logger } from '@/shared/lib/logger'
import {
  FavoriteWorkout,
  UserFavoriteWorkoutRepository,
} from '../_repositories/user-favorite-workout'

@injectable()
export class ListFavoriteWorkoutsService {
  constructor(
    private readonly userFavoriteWorkoutRepository: UserFavoriteWorkoutRepository
  ) {}

  async exec(userId: UserId): Promise<FavoriteWorkout[]> {
    try {
      return await this.userFavoriteWorkoutRepository.listByUser(userId)
    } catch (error) {
      logger.error({
        msg: '[ListFavoriteWorkoutsService] Failed to list favorite workouts',
        userId,
        error,
      })
      throw error instanceof Error
        ? error
        : new Error('Failed to list favorite workouts')
    }
  }
}
