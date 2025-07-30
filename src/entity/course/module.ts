import { ContainerModule } from 'inversify'
import { GetCoursesListService } from './_services/get-courses-list'
import { CoursesRepository } from './_repositories/course'
import { GetCourseService } from './_services/get-course'
import { UserDailyPlanRepository } from './_repositories/user-daily-plan'
import { GetCourseLessonsService } from './_services/get-daily-plan'
import { UserCourseEnrollmentRepository } from './_repositories/user-course-enrollment'
import { CreateCourseEnrollmentService } from './_services/create-course-enrollment'
import { GetCourseEnrollmentService } from './_services/get-course-enrollment'
import { GetUserDailyPlanService } from './_services/get-user-daily-plan'

export const CourseEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetCoursesListService).toSelf()
  bind(CoursesRepository).toSelf()
  bind(GetCourseService).toSelf()
  bind(UserDailyPlanRepository).toSelf()
  bind(GetCourseLessonsService).toSelf()
  bind(UserCourseEnrollmentRepository).toSelf()
  bind(CreateCourseEnrollmentService).toSelf()
  bind(GetCourseEnrollmentService).toSelf()
  bind(GetUserDailyPlanService).toSelf()
})

export {
  GetCoursesListService,
  GetCourseService,
  GetCourseLessonsService,
  CreateCourseEnrollmentService,
  GetCourseEnrollmentService,
  GetUserDailyPlanService,
}
