import { ContainerModule } from 'inversify'
import { GetCoursesListService } from './_services/get-courses-list'
import { CoursesRepository } from './_repositories/course'

export const CourseEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetCoursesListService).toSelf()
  bind(CoursesRepository).toSelf()
})

export { GetCoursesListService }
