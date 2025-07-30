import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

export interface UpdateWorkoutDaysParams {
  enrollmentId: string
  selectedWorkoutDays: DayOfWeek[]
}

@injectable()
export class UpdateWorkoutDaysService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async execute(params: UpdateWorkoutDaysParams): Promise<void> {
    try {
      // Обновляем выбранные дни в enrollment
      await this.userCourseEnrollmentRepository.updateSelectedWorkoutDays(
        params.enrollmentId,
        params.selectedWorkoutDays
      )

      // Обновляем будущие дни тренировок
      await this.userDailyPlanRepository.updateFutureWorkoutDays(
        params.enrollmentId,
        params.selectedWorkoutDays
      )

      logger.info({
        msg: 'Successfully updated workout days',
        enrollmentId: params.enrollmentId,
        selectedWorkoutDays: params.selectedWorkoutDays,
      })
    } catch (error) {
      logger.error({
        msg: 'Error updating workout days',
        params,
        error,
      })
      throw new Error('Failed to update workout days')
    }
  }
} 