import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { CourseDetailsController } from './_controller'
import { GetCourseDetailsService } from './_services/get-course-details'

export const CourseDetailsModule = new ContainerModule(context => {
  const { bind } = context

  bind(GetCourseDetailsService).toSelf()
  bind(Controller).to(CourseDetailsController)
})
