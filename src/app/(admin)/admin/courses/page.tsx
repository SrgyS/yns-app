import { server } from '@/app/server'
import { GetCoursesListService } from '@/entities/course/module'
import { AdminCoursesPage } from '@/features/admin-panel/courses/admin-courses-page'

export default async function AdminCoursesRoute() {
  const getCoursesListService = server.get(GetCoursesListService)
  const courses = await getCoursesListService.exec()

  return <AdminCoursesPage courses={courses} />
}
