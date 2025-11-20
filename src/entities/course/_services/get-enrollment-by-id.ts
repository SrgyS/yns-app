import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetEnrollmentByIdService {
  constructor(
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(enrollmentId: string): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment =
        await this.userCourseEnrollmentRepository.getEnrollmentById(
          enrollmentId
        )

      if (enrollment) {
        logger.info({
          msg: 'Successfully retrieved enrollment by id',
          enrollmentId,
        })
      }

      return enrollment
    } catch (error) {
      logger.error({
        msg: 'Error getting enrollment by id',
        enrollmentId,
        error,
      })
      throw new Error('Failed to get enrollment by id')
    }
  }
}