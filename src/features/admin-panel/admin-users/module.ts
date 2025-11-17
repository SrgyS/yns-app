import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminUsersController } from './_controller'
import { AdminUserRepository } from './_repositories/admin-user-repository'
import { StaffPermissionRepository } from './_repositories/staff-permission-repository'
import { ListAdminUsersService } from './_services/list-admin-users'
import { StaffPermissionService } from './_services/staff-permission-service'

export const AdminUsersModule = new ContainerModule(context => {
  const { bind } = context

  bind(AdminUserRepository).toSelf()
  bind(StaffPermissionRepository).toSelf()
  bind(ListAdminUsersService).toSelf()
  bind(StaffPermissionService).toSelf()
  bind(Controller).to(AdminUsersController)
})

export { AdminUsersController }
