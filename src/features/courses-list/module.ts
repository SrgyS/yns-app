import { ContainerModule } from 'inversify'
import { CoursesListController } from './_controller'
import { Controller } from '@/kernel/lib/trpc/module'
import { GetCourseActionService } from './_services/get-course-action'

export const CoursesListModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(CoursesListController)
  bind(GetCourseActionService).toSelf()
})

export { CoursesListController }
