import type { CourseSlug } from '@/kernel/domain/course'
import type { UserCourseEnrollmentApi } from '@/entities/course'

export type PaidAccessState = {
  hasAccess: boolean
  activeEnrollment: UserCourseEnrollmentApi | null
  activeCourseSlug: CourseSlug | null
  accessExpiresAt: string | null
  accessibleCourses: Array<{
    enrollment: UserCourseEnrollmentApi
    accessExpiresAt: string | null
    setupCompleted: boolean
  }>
}
