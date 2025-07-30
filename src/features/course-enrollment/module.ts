import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from './_controller'

export const CourseEnrollmentControllerModule = new ContainerModule(context => {
  const { bind } = context
  bind(Controller).to(CourseEnrollmentController)
})

export { CourseEnrollmentController }