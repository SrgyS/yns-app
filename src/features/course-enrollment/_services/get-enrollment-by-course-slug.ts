import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '@/entities/course'
import { logger } from '@/shared/lib/logger'
import { CourseSlug } from '@/kernel/domain/course'
import { GetCourseService } from '@/entities/course/_services/get-course'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'

@injectable()
export class GetEnrollmentByCourseSlugService {
  constructor(
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private readonly getCourseService: GetCourseService,
    private readonly userAccessRepository: UserAccessRepository
  ) {}

  async exec(
    userId: string,
    courseSlug: CourseSlug
  ): Promise<UserCourseEnrollment | null> {
    try {
      const course = await this.getCourseService.exec({ slug: courseSlug })
      if (!course) {
        return null
      }

      const access = await this.userAccessRepository.findActiveAccessByCourse(
        userId,
        course.id
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
