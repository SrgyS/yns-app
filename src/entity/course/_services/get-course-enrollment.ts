import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '../../course'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetCourseEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async execute(userId: string, courseId: string): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await this.userCourseEnrollmentRepository.getEnrollment(userId, courseId)

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