import { CoursesListController } from '@/features/courses-list/_controller'
import { GetCoursesListService } from '@/features/course/course.server'
import { Container } from 'inversify'

export function init() {
  const container = new Container()

  container.bind(CoursesListController).toSelf()
  container.bind(GetCoursesListService).toSelf()

  return container
}
