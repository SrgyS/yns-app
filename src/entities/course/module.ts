import { ContainerModule } from 'inversify'
import { GetCoursesListService } from './_services/get-courses-list'
import { CoursesRepository } from './_repositories/course'
import { GetCourseService } from './_services/get-course'
import { UserDailyPlanRepository } from './_repositories/user-daily-plan'
import { UserCourseEnrollmentRepository } from './_repositories/user-course-enrollment'
import { CreateUserCourseEnrollmentService } from './_services/create-user-course-enrollment'
import { GetCourseEnrollmentService } from './_services/get-course-enrollment'
import { GetUserEnrollmentsService } from './_services/get-user-enrollments'
import { GetActiveEnrollmentService } from './_services/get-active-enrollment'
import { GetUserWorkoutDaysService } from './_services/get-user-workout-days'
import { UpdateWorkoutDaysService } from './_services/update-selected-workout-days'
import { GetEnrollmentByIdService } from './_services/get-enrollment-by-id'
import { ActivateEnrollmentService } from './_services/activate-enrollment'
import { GetEnrollmentByCourseSlugService } from './_services/get-enrollment-by-course-slug'

export const CourseEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetCoursesListService).toSelf()
  bind(CoursesRepository).toSelf()
  bind(GetCourseService).toSelf()
  bind(UserDailyPlanRepository).toSelf()
  bind(UserCourseEnrollmentRepository).toSelf()
  bind(CreateUserCourseEnrollmentService).toSelf()
  bind(GetCourseEnrollmentService).toSelf()
  bind(GetUserEnrollmentsService).toSelf()
  bind(GetActiveEnrollmentService).toSelf()
  bind(GetUserWorkoutDaysService).toSelf()
  bind(GetEnrollmentByIdService).toSelf()
  bind(UpdateWorkoutDaysService).toSelf()
  bind(ActivateEnrollmentService).toSelf()
  bind(GetEnrollmentByCourseSlugService).toSelf()
})

export {
  GetCoursesListService,
  GetCourseService,
  CreateUserCourseEnrollmentService,
  GetCourseEnrollmentService,
  GetUserEnrollmentsService,
  GetActiveEnrollmentService,
  GetUserWorkoutDaysService,
  GetEnrollmentByIdService,
  UpdateWorkoutDaysService,
  ActivateEnrollmentService,
  GetEnrollmentByCourseSlugService,
}
