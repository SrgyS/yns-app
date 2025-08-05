import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

export interface UpdateWorkoutDaysParams {
  userId: string
  selectedWorkoutDays: DayOfWeek[]
}

@injectable()
export class UpdateWorkoutDaysService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async exec(params: UpdateWorkoutDaysParams): Promise<void> {
    try {
      // Обновляем выбранные дни в enrollment
      await this.userCourseEnrollmentRepository.updateSelectedWorkoutDays(
        params.userId,
        params.selectedWorkoutDays
      )

      logger.info({
        msg: 'Successfully updated workout days',
        enrollmentId: params.userId,
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