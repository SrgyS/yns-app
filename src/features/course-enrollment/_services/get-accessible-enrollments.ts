import { injectable } from 'inversify'

import type { CourseAccessInfo, UserCourseEnrollment } from '@/entities/course'
import { GetCoursesForAccessCheckService } from '@/entities/course/module'
import { GetUserEnrollmentsService } from './get-user-enrollments'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { logger } from '@/shared/lib/logger'

export type AccessibleEnrollment = {
  enrollment: UserCourseEnrollment
  course: CourseAccessInfo
  accessExpiresAt: Date | null
  setupCompleted: boolean
}

@injectable()
export class GetAccessibleEnrollmentsService {
  constructor(
    private readonly getUserEnrollmentsService: GetUserEnrollmentsService,
    private readonly getCoursesForAccessCheckService: GetCoursesForAccessCheckService,
    private readonly userAccessRepository: UserAccessRepository
  ) {}

  async exec(userId: string): Promise<AccessibleEnrollment[]> {
    const enrollments = await this.getUserEnrollmentsService.exec(userId)

    if (enrollments.length === 0) {
      return []
    }

    const courseIds = Array.from(
      new Set(enrollments.map(enrollment => enrollment.courseId))
    )

    try {
      const [courses, accessMap] = await Promise.all([
        this.getCoursesForAccessCheckService.exec(courseIds),
        this.userAccessRepository.findUserCoursesAccessMap(userId, courseIds),
      ])

      const courseMap = new Map(courses.map(course => [course.id, course]))

      const accessible: AccessibleEnrollment[] = []

      for (const enrollment of enrollments) {
        const course = courseMap.get(enrollment.courseId)

        if (!course) {
          logger.warn({
            msg: '[GetAccessibleEnrollmentsService] Course not found for enrollment',
            enrollmentId: enrollment.id,
            courseId: enrollment.courseId,
          })
          continue
        }

        const accessKey = `${course.id}:${course.contentType}`
        const access = accessMap.get(accessKey)

        if (course.product.access === 'paid') {
          if (!access) {
            continue
          }

          if (access.expiresAt && access.expiresAt.getTime() < Date.now()) {
            continue
          }

          accessible.push({
            enrollment,
            course,
            accessExpiresAt: access.expiresAt ?? null,
            setupCompleted: Boolean(access.setupCompleted),
          })
          continue
        }

        accessible.push({
          enrollment,
          course,
          accessExpiresAt: access?.expiresAt ?? null,
          setupCompleted: access ? Boolean(access.setupCompleted) : true,
        })
      }

      return accessible
    } catch (error) {
      logger.error({
        msg: '[GetAccessibleEnrollmentsService] Failed to resolve access list',
        userId,
        error,
      })
      return []
    }
  }
}
