import { ContainerModule } from 'inversify'
import { UpdateProfileController } from './_controller'
import { Controller } from '@/kernel/lib/trpc/module'

export const UpdateProfileModule = new ContainerModule(context => {
  const { bind } = context
  bind(Controller).to(UpdateProfileController)
})
