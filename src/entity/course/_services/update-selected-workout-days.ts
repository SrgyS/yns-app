import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'
import { dbClient } from '@/shared/lib/db'
import { UserWorkoutCompletionRepository } from '@/entity/workout/_repositories/user-workout-completion'

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

      // Используем транзакцию для атомарного обновления
      await dbClient.$transaction(async tx => {
        // Обновляем выбранные дни в enrollment
        await this.userCourseEnrollmentRepository.updateSelectedWorkoutDays(
          params.enrollmentId,
          params.selectedWorkoutDays,
          tx
        )

          // Обновляем планы
        const updatedPlans = await this.userDailyPlanRepository.updateUserDailyPlans(
          params.enrollmentId,
          params.selectedWorkoutDays,
          tx
        )

        if (params.keepProgress) {
          // Вместо переноса статусов выполнения используем метод updateCompletionsAfterWorkoutDaysChange
          // Подготавливаем данные для метода
          const newUserDailyPlans = await tx.userDailyPlan.findMany({
            where: { enrollmentId: params.enrollmentId },
            select: { 
              id: true, 
              originalDailyPlanId: true, 
              warmupId: true, 
              mainWorkoutId: true, 
            },
          })
          
          // Обновляем записи о выполнении тренировок
          await this.userWorkoutCompletionRepository.updateCompletionsAfterWorkoutDaysChange(
            enrollment.userId,
            params.enrollmentId,
            newUserDailyPlans,
            tx
          )
        } else {
          // Удаляем все записи о выполнении тренировок для этого enrollment
          await tx.userWorkoutCompletion.deleteMany({
            where: {
              enrollmentId: params.enrollmentId,
              userDailyPlanId: { in: updatedPlans.map(plan => plan.id) },
            },
          })
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
