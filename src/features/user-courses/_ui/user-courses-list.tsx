'use client'

import { Course, UserCourseEnrollmentApi } from '@/entities/course'
import { UserCourseItem } from './user-course-item'

interface UserCoursesListProps {
  items: Array<{
    course: Course
    enrollment: UserCourseEnrollmentApi
    freezeUntil: string | null
    accessExpiresAt: string | null
    accessStartedAt: string
  }>
}

export function UserCoursesList({ items }: Readonly<UserCoursesListProps>) {
  if (!items.length) {
    return (
      <div className="text-center py-4">У вас пока нет купленных курсов</div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(
        ({
          enrollment,
          course,
          freezeUntil,
          accessExpiresAt,
          accessStartedAt,
        }) => (
        <UserCourseItem
          course={course}
          enrollment={enrollment}
          accessExpiresAt={accessExpiresAt}
          accessStartedAt={accessStartedAt}
          freezeUntil={freezeUntil}
          key={enrollment.id}
        />
        )
      )}
    </div>
  )
}
