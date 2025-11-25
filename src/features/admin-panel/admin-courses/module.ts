import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminCoursesController } from './_controller'

export const AdminCoursesModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(AdminCoursesController)
})

export { AdminCoursesController } from './_controller'
