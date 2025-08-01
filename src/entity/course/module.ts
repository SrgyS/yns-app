import { ContainerModule } from 'inversify'
import { GetCoursesListService } from './_services/get-courses-list'
import { CoursesRepository } from './_repositories/course'
import { GetCourseService } from './_services/get-course'
import { UserDailyPlanRepository } from './_repositories/user-daily-plan'
import { GetCourseLessonsService } from './_services/get-daily-plan'
import { UserCourseEnrollmentRepository } from './_repositories/user-course-enrollment'
import { CreateUserCourseEnrollmentService } from './_services/create-user-course-enrollment'
import { GetCourseEnrollmentService } from './_services/get-course-enrollment'
import { GetUserDailyPlanService } from './_services/get-user-daily-plan'
import { GetUserEnrollmentsService } from './_services/get-user-enrollments'
import { GetActiveEnrollmentService } from './_services/get-active-enrollment'
import { GetUserWorkoutDaysService } from './_services/get-user-workout-days'

export const CourseEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetCoursesListService).toSelf()
  bind(CoursesRepository).toSelf()
  bind(GetCourseService).toSelf()
  bind(UserDailyPlanRepository).toSelf()
  bind(GetCourseLessonsService).toSelf()
  bind(UserCourseEnrollmentRepository).toSelf()
  bind(CreateUserCourseEnrollmentService).toSelf()
  bind(GetCourseEnrollmentService).toSelf()
  bind(GetUserDailyPlanService).toSelf()
  bind(GetUserEnrollmentsService).toSelf()
  bind(GetActiveEnrollmentService).toSelf()
  bind(GetUserWorkoutDaysService).toSelf()
})

export {
  GetCoursesListService,
  GetCourseService,
  GetCourseLessonsService,
  CreateUserCourseEnrollmentService,
  GetCourseEnrollmentService,
  GetUserDailyPlanService,
  GetUserEnrollmentsService,
  GetActiveEnrollmentService,
  GetUserWorkoutDaysService,
}
