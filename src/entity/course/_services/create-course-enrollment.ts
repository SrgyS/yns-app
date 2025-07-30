import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { CreateUserCourseEnrollmentParams, UserCourseEnrollment } from '../../course'
import { logger } from '@/shared/lib/logger'

@injectable()
export class CreateCourseEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async execute(
    params: CreateUserCourseEnrollmentParams
  ): Promise<UserCourseEnrollment> {
    try {
      const enrollment =
        await this.userCourseEnrollmentRepository.createEnrollment(params)

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