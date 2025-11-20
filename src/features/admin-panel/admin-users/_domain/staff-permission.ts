import { ROLE } from '@prisma/client'

export type StaffPermissionFlags = {
  canViewPayments: boolean
  canEditAccess: boolean
  canManageUsers: boolean
  canGrantAccess: boolean
  canLoginAsUser: boolean
}

export type StaffPermissionRecord = StaffPermissionFlags & {
  userId: string
}

export const defaultAdminPermissions: StaffPermissionFlags = {
  canViewPayments: true,
  canEditAccess: true,
  canManageUsers: true,
  canGrantAccess: true,
  canLoginAsUser: true,
}

export const defaultStaffPermissions: StaffPermissionFlags = {
  canViewPayments: false,
  canEditAccess: false,
  canManageUsers: false,
  canGrantAccess: false,
  canLoginAsUser: false,
}

export const defaultPermissionsByRole: Record<ROLE, StaffPermissionFlags> = {
  ADMIN: defaultAdminPermissions,
  STAFF: defaultStaffPermissions,
  USER: {
    canViewPayments: false,
    canEditAccess: false,
    canManageUsers: false,
    canGrantAccess: false,
    canLoginAsUser: false,
  },
}
