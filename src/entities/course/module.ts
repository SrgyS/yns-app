import { ContainerModule } from 'inversify'
import { CoursesRepository } from './_repositories/course'
import { GetCoursesListService } from './_services/get-courses-list'
import { GetCourseService } from './_services/get-course'
import { GetCoursesForAccessCheckService } from './_services/get-courses-for-access-check'
import { UserDailyPlanRepository } from './_repositories/user-daily-plan'
import { UserCourseEnrollmentRepository } from './_repositories/user-course-enrollment'
import { CreateUserCourseEnrollmentService } from './_services/create-user-course-enrollment'
import { GetActiveEnrollmentService } from './_services/get-active-enrollment'
import { GetUserWorkoutDaysService } from './_services/get-user-workout-days'
import { UpdateWorkoutDaysService } from './_services/update-selected-workout-days'
import { GetEnrollmentByIdService } from './_services/get-enrollment-by-id'
import { ActivateEnrollmentService } from './_services/activate-enrollment'
import { CreateCourseService } from './_services/create-course'
import { DeleteCourseService } from './_services/delete-course'

export const CourseEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetCoursesListService).toSelf()
  bind(CoursesRepository).toSelf()
  bind(GetCourseService).toSelf()
  bind(GetCoursesForAccessCheckService).toSelf()
  bind(UserDailyPlanRepository).toSelf()
  bind(UserCourseEnrollmentRepository).toSelf()
  bind(CreateUserCourseEnrollmentService).toSelf()
  bind(GetActiveEnrollmentService).toSelf()
  bind(GetUserWorkoutDaysService).toSelf()
  bind(GetEnrollmentByIdService).toSelf()
  bind(UpdateWorkoutDaysService).toSelf()
  bind(ActivateEnrollmentService).toSelf()
  bind(CreateCourseService).toSelf()
  bind(DeleteCourseService).toSelf()
})

export { GetCoursesListService } from './_services/get-courses-list'
export { GetCourseService } from './_services/get-course'
export { GetCoursesForAccessCheckService } from './_services/get-courses-for-access-check'
export { CreateUserCourseEnrollmentService } from './_services/create-user-course-enrollment'
export { GetActiveEnrollmentService } from './_services/get-active-enrollment'
export { GetUserWorkoutDaysService } from './_services/get-user-workout-days'
export { GetEnrollmentByIdService } from './_services/get-enrollment-by-id'
export { UpdateWorkoutDaysService } from './_services/update-selected-workout-days'
export { ActivateEnrollmentService } from './_services/activate-enrollment'
export { CreateCourseService } from './_services/create-course'
export { DeleteCourseService } from './_services/delete-course'
