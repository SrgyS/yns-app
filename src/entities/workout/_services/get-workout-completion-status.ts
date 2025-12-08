import { injectable } from 'inversify'
import { UserWorkoutCompletionRepository } from '../_repositories/user-workout-completion'
import { DailyContentType } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetWorkoutCompletionStatusService {
  constructor(
    private readonly userWorkoutCompletionRepository: UserWorkoutCompletionRepository
  ) {}

  async exec(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    contentType: DailyContentType,
    stepIndex: number
  ): Promise<boolean> {
    try {
      return await this.userWorkoutCompletionRepository.getWorkoutCompletionStatus(
        userId,
        workoutId,
        enrollmentId,
        contentType,
        stepIndex
      )
    } catch (error) {
      logger.error({
        msg: 'Error getting workout completion status in service',
        userId,
        workoutId,
        enrollmentId,
        contentType,
        stepIndex,
        error,
      })
      return false // В случае ошибки возвращаем false (тренировка не выполнена)
    }
  }
//TODO удалить закомментированный код если не понадобится
  // async getUserCompletedWorkouts(userId: string, enrollmentId: string) {
  //   try {
  //     return await this.userWorkoutCompletionRepository.getUserCompletedWorkouts(
  //       userId,
  //       enrollmentId
  //     )
  //   } catch (error) {
  //     logger.error({
  //       msg: 'Error getting user completed workouts',
  //       userId,
  //       enrollmentId,
  //       error,
  //     })
  //     return [] // В случае ошибки возвращаем пустой массив
  //   }
  // }
}
