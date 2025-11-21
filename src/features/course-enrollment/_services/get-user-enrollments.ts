import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '@/entities/course'
import { logger } from '@/shared/lib/logger'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'

@injectable()
export class GetUserEnrollmentsService {
  constructor(
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private readonly userAccessRepository: UserAccessRepository
  ) {}

  async exec(userId: string): Promise<UserCourseEnrollment[]> {
    try {
      const accesses =
        await this.userAccessRepository.findActiveAccesses(userId)
      const enrollmentIds = accesses
        .map(access => access.enrollmentId)
        .filter((id): id is string => Boolean(id))

      if (enrollmentIds.length === 0) {
        logger.info({
          msg: 'No active enrollments found for user',
          userId,
        })
        return []
      }

      const enrollmentsList =
        await this.userCourseEnrollmentRepository.getEnrollmentsByIds(
          enrollmentIds
        )

      const enrollmentMap = new Map(
        enrollmentsList.map(enrollment => [enrollment.id, enrollment])
      )

      const enrollments = enrollmentIds
        .map(id => enrollmentMap.get(id))
        .filter((enrollment): enrollment is UserCourseEnrollment =>
          Boolean(enrollment)
        )

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
