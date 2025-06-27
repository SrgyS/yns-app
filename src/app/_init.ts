import { CourseEntityModule } from '@/features/course/server'
import { CoursesListModule } from '@/features/courses-list/server'
import { Container } from 'inversify'

export function init() {
  const container = new Container()

  container.load(CoursesListModule, CourseEntityModule)

  return container
}
