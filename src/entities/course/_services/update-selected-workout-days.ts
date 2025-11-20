import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'
import { dbClient } from '@/shared/lib/db'
import { UserWorkoutCompletionRepository } from '@/entities/workout/_repositories/user-workout-completion'

export interface UpdateWorkoutDaysParams {
  enrollmentId: string
  selectedWorkoutDays: DayOfWeek[]
  keepProgress?: boolean
}

@injectable()
export class UpdateWorkoutDaysService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository,
    private userWorkoutCompletionRepository: UserWorkoutCompletionRepository
  ) {}

  async exec(params: UpdateWorkoutDaysParams): Promise<void> {
    try {
      // Получаем enrollment по id
      const enrollment =
        await this.userCourseEnrollmentRepository.getEnrollmentById(
          params.enrollmentId
        )

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      // Получаем текущие планы до обновления, чтобы иметь исходные индексы
      const previousPlans =
        await this.userDailyPlanRepository.getUserDailyPlansByEnrollment(
          params.enrollmentId
        )

      // Используем транзакцию для атомарного обновления
      await dbClient.$transaction(async tx => {
        // Обновляем выбранные дни в enrollment
        await this.userCourseEnrollmentRepository.updateSelectedWorkoutDays(
          params.enrollmentId,
          params.selectedWorkoutDays,
          tx
        )

        // Обновляем планы
        const updatedPlans =
          await this.userDailyPlanRepository.updateUserDailyPlans(
            params.enrollmentId,
            params.selectedWorkoutDays,
            tx
          )

        if (!params.keepProgress) {
          try {
            await this.userWorkoutCompletionRepository.deleteAllForEnrollment(
              enrollment.userId,
              params.enrollmentId,
              tx
            )
          } catch (error) {
            logger.error({
              msg: 'Error deleting workout completions for enrollment',
              enrollmentId: params.enrollmentId,
              error,
            })
            throw new Error(
              'Failed to delete workout completions for enrollment'
            )
          }
        } else {
          try {
            await this.userWorkoutCompletionRepository.realignCompletionsAfterScheduleChange(
              enrollment.userId,
              params.enrollmentId,
              previousPlans,
              updatedPlans,
              tx
            )
          } catch (error) {
            logger.error({
              msg: 'Error realigning workout completions after schedule change',
              enrollmentId: params.enrollmentId,
              error,
            })
            throw new Error(
              'Failed to realign workout completions after schedule change'
            )
          }
        }
      })

      logger.info({
        msg: 'Successfully updated workout days and daily plans in transaction',
        enrollmentId: params.enrollmentId,
        selectedWorkoutDays: params.selectedWorkoutDays,
        keepProgress: params.keepProgress,
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
