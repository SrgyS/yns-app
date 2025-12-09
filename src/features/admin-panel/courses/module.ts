import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminCoursesController } from './_controller'
import { CoursesReadService } from './_services/courses-read'
import { CoursesWriteService } from './_services/courses-write'

export const AdminCoursesModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(AdminCoursesController)
  bind(CoursesReadService).toSelf()
  bind(CoursesWriteService).toSelf()
})

export { AdminCoursesController } from './_controller'
