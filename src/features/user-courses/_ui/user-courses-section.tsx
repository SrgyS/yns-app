'use client'

import { UserCoursesList } from './user-courses-list'
import { Course } from '@/entities/course'
import { UserId } from '@/kernel/domain/user'

interface UserCoursesSectionProps {
  id: UserId
  courses: Course[]
}

export function UserCoursesSection({ id, courses }: UserCoursesSectionProps) {
  return (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold">Мои курсы</h3>
      <UserCoursesList id={id} courses={courses} />
    </div>
  )
}