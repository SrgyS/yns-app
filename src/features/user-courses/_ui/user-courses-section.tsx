import { UserCourseEnrollment, UserCourseEnrollmentApi } from '@/entities/course'
import { UserCoursesList } from './user-courses-list'
import { UserCourseWithEnrollment } from '../_services/get-user-courses-list'

interface UserCoursesSectionProps {
  courses: UserCourseWithEnrollment[]
}

function mapEnrollmentToClient(enrollment: UserCourseEnrollment): UserCourseEnrollmentApi {
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

export function UserCoursesSection({ courses }: UserCoursesSectionProps) {
  const items = courses.map(({ course, enrollment }) => ({
    course,
    enrollment: mapEnrollmentToClient(enrollment),
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Мои курсы</h3>
      <UserCoursesList items={items} />
    </div>
  )
}
