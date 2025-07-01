'use client'

'use client'
import { Course } from '@/entity/course/course'
import { CourseItem } from './course-item'
import { coursesListApi } from '@/features/courses-list/_api'

export function CoursesListClient({ defaultList }: { defaultList: Course[] }) {
  const { data: coursesList } = coursesListApi.coursesList.get.useQuery(
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
