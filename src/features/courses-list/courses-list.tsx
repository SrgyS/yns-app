import { coursesRepository } from '../course/_repositories/course'
import { CourseItem } from './_ui/course-item'

export async function CoursesList() {
  const coursesList = await coursesRepository.getCoursesList()

  return (
    <div className="flex flex-col gap-4">
      {coursesList.map(course => (
        <CourseItem key={course.id} course={course} />
      ))}
    </div>
  )
}
