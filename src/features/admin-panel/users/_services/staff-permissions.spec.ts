import { ROLE } from '@prisma/client'

import { StaffPermissionService } from './staff-permissions'
import {
  defaultAdminPermissions,
  defaultStaffPermissions,
} from '../_domain/staff-permission'

describe('StaffPermissionService', () => {
  const repo = {
    findByUserId: jest.fn(),
  }
  const service = new StaffPermissionService(repo as any)

  beforeEach(() => {
    repo.findByUserId.mockReset()
  })

  test('returns default permissions for admin/user roles', async () => {
    const admin = await service.getPermissionsForUser({
      id: 'a',
      role: ROLE.ADMIN,
    })
    const user = await service.getPermissionsForUser({
      id: 'u',
      role: ROLE.USER,
    })

    expect(admin).toEqual(defaultAdminPermissions)
    expect(user).toEqual(defaultStaffPermissions)
    expect(repo.findByUserId).not.toHaveBeenCalled()
  })

  test('returns stored staff permissions when available', async () => {
    repo.findByUserId.mockResolvedValue({
      canViewPayments: true,
      canEditAccess: false,
      canManageUsers: true,
      canGrantAccess: false,
      canLoginAsUser: true,
      canManageCourses: false,
      userId: 's',
    })

    const staff = await service.getPermissionsForUser({
      id: 's',
      role: ROLE.STAFF,
    })

    expect(staff).toEqual({
      canViewPayments: true,
      canEditAccess: false,
      canManageUsers: true,
      canGrantAccess: false,
      canLoginAsUser: true,
      canManageCourses: false,
    })
  })

  test('falls back to defaults when staff permissions are missing', async () => {
    repo.findByUserId.mockResolvedValue(null)

    const staff = await service.getPermissionsForUser({
      id: 's',
      role: ROLE.STAFF,
    })

    expect(staff).toEqual(defaultStaffPermissions)
  })
})
