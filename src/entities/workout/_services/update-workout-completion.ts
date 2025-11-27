import { injectable } from 'inversify'
import { UserWorkoutCompletionRepository } from '../_repositories/user-workout-completion'
import { DailyContentType } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

export interface UpdateWorkoutCompletionParams {
  userId: string
  workoutId: string
  enrollmentId: string
  isCompleted: boolean
  contentType: DailyContentType
  stepIndex: number
}

@injectable()
export class UpdateWorkoutCompletionService {
  constructor(
    private userWorkoutCompletionRepository: UserWorkoutCompletionRepository
  ) {}

  async exec({
    userId,
    workoutId,
    enrollmentId,
    isCompleted,
    contentType,
    stepIndex,
  }: UpdateWorkoutCompletionParams): Promise<void> {
    try {
      if (isCompleted) {
        await this.userWorkoutCompletionRepository.markWorkoutAsCompleted(
          userId,
          workoutId,
          enrollmentId,
          contentType,
          stepIndex
        )
      } else {
        await this.userWorkoutCompletionRepository.removeWorkoutCompletion(
          userId,
          enrollmentId,
          contentType,
          stepIndex
        )
      }

      logger.info({
        msg: `Workout ${isCompleted ? 'marked as completed' : 'marked as not completed'}`,
        userId,
        workoutId,
        enrollmentId,
        contentType,
        stepIndex,
      })
    } catch (error) {
      logger.error({
        msg: 'Error updating workout completion status',
        userId,
        workoutId,
        enrollmentId,
        contentType,
        stepIndex,
        error,
      })
      throw new Error('Failed to update workout completion status')
    }
  }
}
