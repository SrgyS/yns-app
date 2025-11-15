import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminUsersController } from './_controller'
import { AdminUserRepository } from './_repositories/admin-user-repository'
import { ListAdminUsersService } from './_services/list-admin-users'

export const AdminUsersModule = new ContainerModule(context => {
  const { bind } = context

  bind(AdminUserRepository).toSelf()
  bind(ListAdminUsersService).toSelf()
  bind(Controller).to(AdminUsersController)
})

export { AdminUsersController }
