import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '../../course'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetUserEnrollmentsService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(userId: string): Promise<UserCourseEnrollment[]> {
    try {
      const enrollments = await this.userCourseEnrollmentRepository.getUserEnrollments(userId)

      logger.info({
        msg: 'Successfully retrieved user enrollments',
        userId,
        enrollmentsCount: enrollments.length,
      })

      return enrollments
    } catch (error) {
      logger.error({
        msg: 'Error getting user enrollments',
        userId,
        error,
      })
      throw new Error('Failed to get user enrollments')
    }
  }
} 