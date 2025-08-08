import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'
import { dbClient } from '@/shared/lib/db'

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
      // Получаем активную запись на курс
      const activeEnrollment =
        await this.userCourseEnrollmentRepository.getActiveEnrollment(
          params.userId
        )

      if (!activeEnrollment) {
        throw new Error('Active enrollment not found')
      }

      // Используем транзакцию для атомарного обновления
      await dbClient.$transaction(async tx => {
        // Обновляем выбранные дни в enrollment
        await this.userCourseEnrollmentRepository.updateSelectedWorkoutDays(
          activeEnrollment.id,
          params.selectedWorkoutDays,
          tx
        )

        await this.userDailyPlanRepository.updateUserDailyPlans(
          activeEnrollment.id,
          params.selectedWorkoutDays,
          tx
        )
      })

      logger.info({
        msg: 'Successfully updated workout days and daily plans in transaction',
        userId: params.userId,
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
