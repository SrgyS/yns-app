import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { CreateUserCourseEnrollmentParams, UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'

@injectable()
export class CreateUserCourseEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async exec(
    params: CreateUserCourseEnrollmentParams
  ): Promise<UserCourseEnrollment> {
    try {
      const existingEnrollments =
        await this.userCourseEnrollmentRepository.getUserEnrollments(
          params.userId
        )

      let selectedWorkoutDays = params.selectedWorkoutDays

      if (existingEnrollments.length > 0) {
        const existingWorkoutDays = existingEnrollments[0].selectedWorkoutDays
        if (existingWorkoutDays.length > 0) {
          selectedWorkoutDays = existingWorkoutDays
        }
        
        // Деактивируем все предыдущие записи пользователя на курсы
        await this.userCourseEnrollmentRepository.deactivateUserEnrollments(params.userId)
      }

      const enrollment =
        await this.userCourseEnrollmentRepository.createEnrollment({
          ...params,
          selectedWorkoutDays,
        })

      await this.userDailyPlanRepository.generateUserDailyPlansForEnrollment(
        enrollment.id
      )

      logger.info({
        msg: 'Successfully created course enrollment with daily plans',
        userId: params.userId,
        courseId: params.courseId,
        enrollmentId: enrollment.id,
      })

      return enrollment
    } catch (error) {
      logger.error({
        msg: 'Error creating course enrollment',
        params,
        error,
      })
      throw new Error('Failed to create course enrollment')
    }
  }
}
