import { injectable } from 'inversify'

import type { UserId } from '@/kernel/domain/user'
import { logger } from '@/shared/lib/logger'
import { UserFavoriteWorkoutRepository } from '../_repositories/user-favorite-workout'


@injectable()
export class ToggleFavoriteWorkoutService {
  constructor(
    private readonly userFavoriteWorkoutRepository: UserFavoriteWorkoutRepository
  ) {}

  async exec({userId, workoutId}: {userId: UserId; workoutId: string}) {
    try {
      return await this.userFavoriteWorkoutRepository.toggle(
        userId,
        workoutId
      )
    } catch (error) {
      logger.error({
        msg: '[ToggleFavoriteWorkoutService] Failed to toggle favorite workout',
        userId,
        workoutId,
        error,
      })
      throw error instanceof Error
        ? error
        : new Error('Failed to toggle favorite workout')
    }
  }
}
