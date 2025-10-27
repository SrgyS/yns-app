import { injectable } from 'inversify'

import type { Course } from '@/entities/course'
import {
  GetCourseService,
  GetUserEnrollmentsService,
} from '@/entities/course/module'
import type { UserCourseEnrollment } from '@/entities/course'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { logger } from '@/shared/lib/logger'

export type AccessibleEnrollment = {
  enrollment: UserCourseEnrollment
  course: Course
  accessExpiresAt: Date | null
}

@injectable()
export class GetAccessibleEnrollmentsService {
  constructor(
    private readonly getUserEnrollmentsService: GetUserEnrollmentsService,
    private readonly getCourseService: GetCourseService,
    private readonly checkCourseAccessService: CheckCourseAccessService,
    private readonly userAccessRepository: UserAccessRepository
  ) {}

  async exec(userId: string): Promise<AccessibleEnrollment[]> {
    const enrollments =
      await this.getUserEnrollmentsService.exec(userId)

    if (enrollments.length === 0) {
      return []
    }

    const results = await Promise.all(
      enrollments.map(async enrollment => {
        try {
          const course = await this.getCourseService.exec({
            id: enrollment.courseId,
          })

          if (!course || !course.product || !course.contentType) {
            return null
          }

          const hasAccess = await this.checkCourseAccessService.exec({
            userId,
            course: {
              id: course.id,
              product: course.product,
              contentType: course.contentType,
            },
          })

          if (!hasAccess) {
            return null
          }

          const userAccess =
            await this.userAccessRepository.findUserCourseAccess(
              userId,
              course.id,
              course.contentType
            )

          return {
            enrollment,
            course,
            accessExpiresAt: userAccess?.expiresAt ?? null,
          }
        } catch (error) {
          logger.error({
            msg: '[GetAccessibleEnrollmentsService] Failed to resolve access',
            enrollmentId: enrollment.id,
            courseId: enrollment.courseId,
            error,
          })
          return null
        }
      })
    )

    return results.filter(
      (result): result is AccessibleEnrollment => Boolean(result)
    )
  }
}
