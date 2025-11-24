import {
  UserCourseEnrollment,
  UserCourseEnrollmentApi,
} from '@/entities/course'
import { UserCoursesList } from './user-courses-list'
import { UserCourseWithEnrollment } from '../_services/get-user-courses-list'

interface UserCoursesSectionProps {
  courses: UserCourseWithEnrollment[]
}

function mapEnrollmentToClient(
  enrollment: UserCourseEnrollment
): UserCourseEnrollmentApi {
  return {
    id: enrollment.id,
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    selectedWorkoutDays: enrollment.selectedWorkoutDays,
    startDate: new Date(enrollment.startDate).toISOString(),
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

export function UserCoursesSection({
  courses,
}: Readonly<UserCoursesSectionProps>) {
  const items = courses.map(
    ({
      course,
      enrollment,
      freezeUntil,
      accessExpiresAt,
      accessStartedAt,
    }) => ({
      course,
      enrollment: mapEnrollmentToClient(enrollment),
      freezeUntil: freezeUntil ? freezeUntil.toISOString() : null,
      accessExpiresAt: accessExpiresAt ? accessExpiresAt.toISOString() : null,
      accessStartedAt: accessStartedAt.toISOString(),
    })
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Мои курсы</h3>
      <UserCoursesList items={items} />
    </div>
  )
}
