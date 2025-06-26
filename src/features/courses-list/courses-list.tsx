import { CoursesListClient } from './_ui/courses-list'
import { coursesListServerApi } from './controller'

export async function CoursesList() {
  const coursesList = await coursesListServerApi.corusesList.get.fetch()

  return <CoursesListClient defaultList={coursesList} />
}
