import { SharedSession } from '@/kernel/domain/user'

import { StaffPermissionFlags } from './staff-permission'

export type AdminAbility = ReturnType<typeof createAdminAbility>

export const createAdminAbility = (
  session: SharedSession,
  permissions: StaffPermissionFlags
) => {
  const isAdmin = session.user.role === 'ADMIN'
  const isStaff = session.user.role === 'STAFF'
  const canVisitAdminPanel = isAdmin || isStaff

  const resolvePermission = (flag: keyof StaffPermissionFlags) =>
    isAdmin ? true : canVisitAdminPanel && permissions[flag]

  return {
    isAdmin,
    isStaff,
    canVisitAdminPanel,
    canManageUsers: resolvePermission('canManageUsers'),
    canGrantAccess: resolvePermission('canGrantAccess'),
    canEditAccess: resolvePermission('canEditAccess'),
    canViewPayments: resolvePermission('canViewPayments'),
    canLoginAsUser: resolvePermission('canLoginAsUser'),
    canManageCourses: resolvePermission('canManageCourses'),
  }
}
