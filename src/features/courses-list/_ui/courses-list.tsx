'use client'

'use client'
import { CourseEntity } from '@/features/course/course'
import { CourseItem } from './course-item'
import { coursesListApi } from '@/features/courses-list/api'

export function CoursesListClient({
  defaultList,
}: {
  defaultList: CourseEntity[]
}) {
  const { data: coursesList } = coursesListApi.corusesList.get.useQuery(
    undefined,
    {
      initialData: defaultList,
    }
  )

  return (
    <div className="flex flex-col gap-3">
      {coursesList.map(course => (
        <CourseItem key={course.id} course={course} />
      ))}
    </div>
  )
}
