import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from './_controller'
import { CreateUserCourseEnrollmentWithCourseAccessService } from './_services/create-user-course-enrollment-with-access'
import { GetAvailableWeeksService } from './_services/get-available-weeks'
import { GetAccessibleEnrollmentsService } from './_services/get-accessible-enrollments'
import { GetCourseEnrollmentService } from './_services/get-course-enrollment'
import { GetUserEnrollmentsService } from './_services/get-user-enrollments'
import { GetEnrollmentByCourseSlugService } from './_services/get-enrollment-by-course-slug'

export const CourseEnrollmentControllerModule = new ContainerModule(context => {
  const { bind } = context
  bind(CreateUserCourseEnrollmentWithCourseAccessService).toSelf()
  bind(GetAvailableWeeksService).toSelf()
  bind(GetAccessibleEnrollmentsService).toSelf()
  bind(GetCourseEnrollmentService).toSelf()
  bind(GetUserEnrollmentsService).toSelf()
  bind(GetEnrollmentByCourseSlugService).toSelf()
  bind(Controller).to(CourseEnrollmentController)
})

export {
  CourseEnrollmentController,
  CreateUserCourseEnrollmentWithCourseAccessService,
  GetAvailableWeeksService,
  GetAccessibleEnrollmentsService,
  GetCourseEnrollmentService,
  GetUserEnrollmentsService,
  GetEnrollmentByCourseSlugService,
}
