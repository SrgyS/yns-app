import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminCoursesController } from './_controller'
import { CoursesReadService } from './_services/courses-read'
import { CoursesWriteService } from './_services/courses-write'
import { CourseDependencyService } from './_services/course-dependency.service'
import { CourseWeekService } from './_services/course-week.service'
import { DailyPlanService } from './_services/daily-plan.service'
import { MealPlanService } from './_services/meal-plan.service'

export const AdminCoursesModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(AdminCoursesController)
  bind(CoursesReadService).toSelf()
  bind(CoursesWriteService).toSelf()
  bind(CourseDependencyService).toSelf()
  bind(CourseWeekService).toSelf()
  bind(DailyPlanService).toSelf()
  bind(MealPlanService).toSelf()
})

export { AdminCoursesController } from './_controller'
