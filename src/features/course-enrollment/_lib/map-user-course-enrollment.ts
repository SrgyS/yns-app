import type {
  UserCourseEnrollment,
  UserCourseEnrollmentApi,
} from '@/entities/course'

export function toUserCourseEnrollmentApi(
  enrollment: UserCourseEnrollment
): UserCourseEnrollmentApi {
  return {
    id: enrollment.id,
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    selectedWorkoutDays: enrollment.selectedWorkoutDays,
    startDate: enrollment.startDate.toISOString(),
    hasFeedback: enrollment.hasFeedback,
    active: enrollment.active,
    course: enrollment.course
      ? {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          title: enrollment.course.title,
        }
      : undefined,
  }
}
