import { ContainerModule } from 'inversify'
import { AdminRecipesController } from './_controller'
import { Controller } from '@/kernel/lib/trpc/module'

export const AdminRecipesModule = new ContainerModule(context => {
  const { bind } = context
  bind(AdminRecipesController).toSelf()
  bind(Controller).toService(AdminRecipesController)
})
