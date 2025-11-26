import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminWorkoutsController } from './_controller'

export const AdminWorkoutsModule = new ContainerModule(context => {
  const { bind } = context
  bind(Controller).to(AdminWorkoutsController)
})

export { AdminWorkoutsController } from './_controller'
