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
import { UpdateWorkoutDaysService } from './_services/update-workout-days'
import { GetEnrollmentByIdService } from './_services/get-enrollment-by-id'

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
  bind(UpdateWorkoutDaysService).toSelf()
  bind(GetEnrollmentByIdService).toSelf()
})

export {
  GetCoursesListService,
  GetCourseService,
  GetCourseLessonsService,
  CreateCourseEnrollmentService,
  GetCourseEnrollmentService,
  GetUserDailyPlanService,
  UpdateWorkoutDaysService,
  GetEnrollmentByIdService,
}
