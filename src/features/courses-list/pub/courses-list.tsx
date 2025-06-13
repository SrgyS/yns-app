import { revalidatePath } from 'next/cache'
import { coursesRepository } from '../courses.repository'
import { CourseItem } from '../ui/course-item'

export async function CoursesList({ revalidatePagePath }: { revalidatePagePath: string }) {
  const coursesList = await coursesRepository.getCoursesList()

  const handleDeleteAction = async (courseid: string) => {
    'use server'

    await coursesRepository.deleteCourseListElement({ id: courseid })

    await revalidatePath(revalidatePagePath)
  }

  return (
    <div className="flex flex-col gap-4">
      {coursesList.map(course => (
        <CourseItem
          key={course.id}
          course={course}
          onDelete={handleDeleteAction.bind(null, course.id)}
        />
      ))}
    </div>
  )
}
