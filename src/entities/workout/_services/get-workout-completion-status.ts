import { injectable } from 'inversify'
import { UserWorkoutCompletionRepository } from '../_repositories/user-workout-completion'
import { WorkoutType } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetWorkoutCompletionStatusService {
  constructor(private userWorkoutCompletionRepository: UserWorkoutCompletionRepository) {}


  async exec(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    workoutType: WorkoutType,
    userDailyPlanId: string,
  ): Promise<boolean> {
    try {
      return await this.userWorkoutCompletionRepository.getWorkoutCompletionStatus(
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
      )
    } catch (error) {
      logger.error({
        msg: 'Error getting workout completion status in service',
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
        error,
      })
      return false // В случае ошибки возвращаем false (тренировка не выполнена)
    }
  }

  async getUserCompletedWorkouts(userId: string, enrollmentId: string) {
    try {
      return await this.userWorkoutCompletionRepository.getUserCompletedWorkouts(
        userId,
        enrollmentId,
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