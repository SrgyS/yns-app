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
        let transferMapping: { oldPlanId: string; newPlanId: string }[] = []

        // Обновляем выбранные дни в enrollment
        await this.userCourseEnrollmentRepository.updateSelectedWorkoutDays(
          params.enrollmentId,
          params.selectedWorkoutDays,
          tx
        )

        // Получаем текущие планы перед обновлением
        const oldPlans = await tx.userDailyPlan.findMany({
          where: { enrollmentId: params.enrollmentId },
          select: { id: true, dayNumberInCourse: true, isWorkoutDay: true },
        })

        // Обновляем планы
        await this.userDailyPlanRepository.updateUserDailyPlans(
          params.enrollmentId,
          params.selectedWorkoutDays,
          tx
        )

        if (params.keepProgress) {
          // Получаем новые планы после обновления
          const newPlans = await tx.userDailyPlan.findMany({
            where: { enrollmentId: params.enrollmentId },
            select: { id: true, dayNumberInCourse: true, isWorkoutDay: true },
          })

          // Создаем маппинг старых планов на новые по dayNumberInCourse
          transferMapping = oldPlans
            .map(oldPlan => {
              const newPlan = newPlans.find(
                p => p.dayNumberInCourse === oldPlan.dayNumberInCourse
              )
              return {
                oldPlanId: oldPlan.id,
                newPlanId: newPlan?.id || oldPlan.id, // fallback на старый ID
              }
            })
            .filter(mapping => mapping.oldPlanId !== mapping.newPlanId)

          // Переносим статусы выполнения для всех дней (и тренировочных, и с зарядками)
          for (const mapping of transferMapping) {
            const newPlan = newPlans.find(p => p.id === mapping.newPlanId)

            // Переносим для всех дней, а не только тренировочных
            if (newPlan) {
              await this.userWorkoutCompletionRepository.transferWorkoutCompletions(
                mapping.oldPlanId,
                mapping.newPlanId,
                tx
              )
            }
          }
        } else {
          // Удаляем все записи о выполнении тренировок для этого enrollment
          await tx.userWorkoutCompletion.deleteMany({
            where: {
              enrollmentId: params.enrollmentId,
              userDailyPlanId: { in: oldPlans.map(plan => plan.id) },
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
