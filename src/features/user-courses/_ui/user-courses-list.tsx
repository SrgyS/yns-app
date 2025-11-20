'use client'

import { Course, UserCourseEnrollmentApi } from '@/entities/course'
import { UserCourseItem } from './user-course-item'

interface UserCoursesListProps {
  items: Array<{
    course: Course
    enrollment: UserCourseEnrollmentApi
  }>
}

export function UserCoursesList({ items }: UserCoursesListProps) {
  if (!items.length) {
    return (
      <div className="text-center py-4">У вас пока нет купленных курсов</div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map(({ enrollment, course }) => (
        <UserCourseItem
          course={course}
          enrollment={enrollment}
          key={enrollment.id}
        />
      ))}
    </div>
  )
}
