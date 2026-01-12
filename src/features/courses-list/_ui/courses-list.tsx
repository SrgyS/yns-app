'use client'

import { Course } from '@/entities/course'
import { CourseItem } from './course-item'
import { coursesListApi } from '@/features/courses-list/_api'

export function CoursesListClient({
  defaultList,
}: Readonly<{ defaultList: Course[] }>) {
  const { data: coursesList } = coursesListApi.coursesList.get.useQuery(
    undefined,
    {
      initialData: defaultList,
    }
  )

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {coursesList.length > 0 ? (
        coursesList.map(course => (
          <CourseItem key={course.id} course={course} />
        ))
      ) : (
        <p>курсы не найдены</p>
      )}
    </div>
  )
}
