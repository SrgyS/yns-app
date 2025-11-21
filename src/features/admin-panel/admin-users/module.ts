import { ContainerModule } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'
import { AdminUsersController } from './_controller'
import { AdminUserRepository } from './_repositories/admin-users'
import { StaffPermissionRepository } from './_repositories/staff-permissions'
import { ListAdminUsersService } from './_services/users-list'
import { GetAdminUserDetailService } from './_services/get-admin-user-detail'
import { StaffPermissionService } from './_services/staff-permissions'
import { GrantCourseAccessService } from './_services/grant-course-access'
import { CloseUserAccessService } from './_services/close-user-access'
import { ExtendUserAccessService } from './_services/extend-user-access'
import { FreezeUserAccessService } from './_services/freeze-user-access'
import { UnfreezeUserAccessService } from './_services/unfreeze-user-access'

export const AdminUsersModule = new ContainerModule(context => {
  const { bind } = context

  bind(AdminUserRepository).toSelf()
  bind(StaffPermissionRepository).toSelf()
  bind(ListAdminUsersService).toSelf()
  bind(GetAdminUserDetailService).toSelf()
  bind(StaffPermissionService).toSelf()
  bind(GrantCourseAccessService).toSelf()
  bind(CloseUserAccessService).toSelf()
  bind(ExtendUserAccessService).toSelf()
  bind(FreezeUserAccessService).toSelf()
  bind(UnfreezeUserAccessService).toSelf()
  bind(Controller).to(AdminUsersController)
})

export { AdminUsersController } from './_controller'
