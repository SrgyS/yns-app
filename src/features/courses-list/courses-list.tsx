import { CoursesListClient } from './_ui/courses-list'
import { coursesListHttpApi } from './_api'

export async function CoursesList() {
  const coursesList = await coursesListHttpApi.coursesList.get.query()

  return <CoursesListClient defaultList={coursesList} />
}
