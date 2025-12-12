import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { UserRecipesController } from './_controller'

export const UserRecipesModule = new ContainerModule(context => {
  const { bind } = context
  bind(UserRecipesController).toSelf()
  bind(Controller).toService(UserRecipesController)
})

export { UserRecipesController } from './_controller'
