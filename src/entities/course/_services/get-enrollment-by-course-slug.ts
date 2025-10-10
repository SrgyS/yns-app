import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'
import { CourseSlug } from '@/kernel/domain/course'

@injectable()
export class GetEnrollmentByCourseSlugService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(userId: string, courseSlug: CourseSlug): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await this.userCourseEnrollmentRepository.getEnrollmentByUserIdAndCourseSlug(userId, courseSlug)

      if (enrollment) {
        logger.info({
          msg: 'Successfully retrieved course enrollment by slug',
          userId,
          courseSlug,
          enrollmentId: enrollment.id,
        })
      }

      return enrollment
    } catch (error) {
      logger.error({
        msg: 'Error getting course enrollment by slug',
        userId,
        courseSlug,
        error,
      })
      throw new Error('Failed to get enrollment by slug')
    }
  }
}