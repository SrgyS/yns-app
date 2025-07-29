import { ContainerModule } from 'inversify'
import { GetCoursesListService } from './_services/get-courses-list'
import { CoursesRepository } from './_repositories/course'
import { GetCourseService } from './_services/get-course'
import { DailyPlanRepository } from './_repositories/daily-plan'
import { GetCourseLessonsService } from './_services/get-daily-plan'

export const CourseEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetCoursesListService).toSelf()
  bind(CoursesRepository).toSelf()
  bind(GetCourseService).toSelf()
  bind(DailyPlanRepository).toSelf()
  bind(GetCourseLessonsService).toSelf()
})

export { GetCoursesListService, GetCourseService, GetCourseLessonsService }
