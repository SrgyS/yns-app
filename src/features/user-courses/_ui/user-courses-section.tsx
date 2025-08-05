'use client'

import { UserCoursesList } from './user-courses-list'
import { Separator } from '@/shared/ui/separator'
import { Course } from '@/entity/course'
import { UserId } from '@/kernel/domain/user'

interface UserCoursesSectionProps {
  id: UserId
  courses: Course[]
}

export function UserCoursesSection({ id, courses }: UserCoursesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Мои курсы</h3>
      </div>
      <Separator />
      <UserCoursesList id={id} courses={courses} />
    </div>
  )
}