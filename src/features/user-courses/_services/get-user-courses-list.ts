import { Course, UserCourseEnrollment } from '@/entities/course'
import { CoursesRepository } from '@/entities/course/_repositories/course'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { UserFreezeRepository } from '@/entities/user-access/_repository/user-freeze'
import { UserId } from '@/kernel/domain/user'
import { injectable } from 'inversify'

export type UserCourseWithEnrollment = {
  course: Course
  enrollment: UserCourseEnrollment
  freezeUntil: Date | null
  accessExpiresAt: Date | null
  accessStartedAt: Date
}

@injectable()
export class GetUserCoursesListService {
  constructor(
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly userAccessRepository: UserAccessRepository,
    private readonly userFreezeRepository: UserFreezeRepository
  ) {}

  async exec(userId: UserId): Promise<UserCourseWithEnrollment[]> {
    const accesses = await this.userAccessRepository.findActiveAccesses(userId)
    if (accesses.length === 0) {
      return []
    }

    const activeFreeze = await this.userFreezeRepository.findActive(userId)

    const enrollmentIds = accesses.flatMap(access =>
      access.enrollmentId ? [access.enrollmentId] : []
    )
    const courseIds = Array.from(new Set(accesses.map(access => access.courseId)))

    const [enrollmentsList, courses] = await Promise.all([
      this.userCourseEnrollmentRepository.getEnrollmentsByIds(enrollmentIds),
      Promise.all(courseIds.map(courseId => this.coursesRepository.courseById(courseId))),
    ])

    if (enrollmentsList.length === 0) {
      return []
    }

    const enrollmentMap = new Map(
      enrollmentsList.map(enrollment => [enrollment.id, enrollment])
    )
    const courseMap = new Map(
      (courses.filter(Boolean) as Course[]).map(course => [course.id, course])
    )

    const courseCache = new Map<string, Course | null>()
    const now = Date.now()

    const userCourses = await Promise.all(
      accesses.map(async access => {
        const enrollment = access.enrollmentId
          ? enrollmentMap.get(access.enrollmentId)
          : undefined

        if (!enrollment) {
          return null
        }

        let course = courseCache.get(enrollment.courseId) ?? null

        if (!courseCache.has(enrollment.courseId)) {
          course = courseMap.get(enrollment.courseId) ?? null
          courseCache.set(enrollment.courseId, course ?? null)
        }

        if (!course) {
          return null
        }

        const isActive =
          !access.expiresAt || access.expiresAt.getTime() > now

        if (!isActive) {
          return null
        }

        return {
          course,
          enrollment,
          freezeUntil: activeFreeze ? activeFreeze.end : null,
          accessExpiresAt: access.expiresAt ?? null,
          accessStartedAt: enrollment.startDate,
        }
      })
    )

    return userCourses.filter(
      (item): item is UserCourseWithEnrollment => !!item
    )
  }
}
