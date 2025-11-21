import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '@/entities/course'
import { logger } from '@/shared/lib/logger'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'

@injectable()
export class GetCourseEnrollmentService {
  constructor(
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private readonly userAccessRepository: UserAccessRepository
  ) {}

  async exec(
    userId: string,
    courseId: string
  ): Promise<UserCourseEnrollment | null> {
    try {
      const access = await this.userAccessRepository.findActiveAccessByCourse(
        userId,
        courseId
      )

      if (!access?.enrollmentId) {
        return null
      }

      const enrollment =
        await this.userCourseEnrollmentRepository.getEnrollmentById(
          access.enrollmentId
        )

      if (enrollment) {
        logger.info({
          msg: 'Successfully retrieved course enrollment',
          userId,
          courseId,
          enrollmentId: enrollment.id,
        })
      }

      return enrollment
    } catch (error) {
      logger.error({
        msg: 'Error getting course enrollment',
        userId,
        courseId,
        error,
      })
      throw new Error('Failed to get course enrollment')
    }
  }
}
