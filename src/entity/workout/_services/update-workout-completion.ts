import { injectable } from 'inversify'
import { UserWorkoutCompletionRepository } from '../_repositories/user-workout-completion'
import { WorkoutType } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

export interface UpdateWorkoutCompletionParams {
  userId: string
  workoutId: string
  enrollmentId: string
  workoutType: WorkoutType
  isCompleted: boolean
  userDailyPlanId: string
}

@injectable()
export class UpdateWorkoutCompletionService {
  constructor(
    private userWorkoutCompletionRepository: UserWorkoutCompletionRepository
  ) {}

  async exec({ userId, workoutId, enrollmentId, workoutType, isCompleted, userDailyPlanId }: UpdateWorkoutCompletionParams): Promise<void> {
    try {

      if (isCompleted) {
        await this.userWorkoutCompletionRepository.markWorkoutAsCompleted(
          userId,
          workoutId,
          enrollmentId,
          workoutType,
          userDailyPlanId,
        )
      } else {
        await this.userWorkoutCompletionRepository.removeWorkoutCompletion(
          userId,
          workoutId,
          enrollmentId,
          workoutType,
          userDailyPlanId,
        )
      }

      logger.info({
        msg: `Workout ${isCompleted ? 'marked as completed' : 'marked as not completed'}`,
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
      })
    } catch (error) {
      logger.error({
        msg: 'Error updating workout completion status',
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
        error,
      })
      throw new Error('Failed to update workout completion status')
    }
  }
}