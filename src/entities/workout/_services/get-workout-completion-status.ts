import { injectable } from 'inversify'
import { UserWorkoutCompletionRepository } from '../_repositories/user-workout-completion'
import { DailyContentType } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetWorkoutCompletionStatusService {
  constructor(
    private userWorkoutCompletionRepository: UserWorkoutCompletionRepository
  ) {}

  async exec(
    userId: string,
    enrollmentId: string,
    contentType: DailyContentType,
    stepIndex: number
  ): Promise<boolean> {
    try {
      return await this.userWorkoutCompletionRepository.getWorkoutCompletionStatus(
        userId,
        enrollmentId,
        contentType,
        stepIndex
      )
    } catch (error) {
      logger.error({
        msg: 'Error getting workout completion status in service',
        userId,
        enrollmentId,
        contentType,
        stepIndex,
        error,
      })
      return false // В случае ошибки возвращаем false (тренировка не выполнена)
    }
  }

  async getUserCompletedWorkouts(userId: string, enrollmentId: string) {
    try {
      return await this.userWorkoutCompletionRepository.getUserCompletedWorkouts(
        userId,
        enrollmentId
      )
    } catch (error) {
      logger.error({
        msg: 'Error getting user completed workouts',
        userId,
        enrollmentId,
        error,
      })
      return [] // В случае ошибки возвращаем пустой массив
    }
  }
}
