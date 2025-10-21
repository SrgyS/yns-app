import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from './_controller'
import { CreateUserCourseEnrollmentWithCourseAccessService } from './_services/create-user-course-enrollment-with-access'
import { GetAvailableWeeksService } from './_services/get-available-weeks'

export const CourseEnrollmentControllerModule = new ContainerModule(context => {
  const { bind } = context
  bind(CreateUserCourseEnrollmentWithCourseAccessService).toSelf()
  bind(GetAvailableWeeksService).toSelf()
  bind(Controller).to(CourseEnrollmentController)
})

export {
  CourseEnrollmentController,
  CreateUserCourseEnrollmentWithCourseAccessService,
  GetAvailableWeeksService,
}
