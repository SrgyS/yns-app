import { createAdminAbility } from './ability'
import type { SharedSession } from '@/kernel/domain/user'
import { defaultStaffPermissions } from './staff-permission'

describe('createAdminAbility', () => {
  const baseSession = (role: SharedSession['user']['role']): SharedSession => ({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      role,
      name: null,
      image: null,
    },
    expires: '2099-01-01T00:00:00.000Z',
  })

  test('grants all permissions to admin', () => {
    const ability = createAdminAbility(baseSession('ADMIN'), defaultStaffPermissions)

    expect(ability.isAdmin).toBe(true)
    expect(ability.isStaff).toBe(false)
    expect(ability.canVisitAdminPanel).toBe(true)
    expect(ability.canManageUsers).toBe(true)
    expect(ability.canGrantAccess).toBe(true)
    expect(ability.canEditAccess).toBe(true)
    expect(ability.canViewPayments).toBe(true)
    expect(ability.canLoginAsUser).toBe(true)
    expect(ability.canManageCourses).toBe(true)
    expect(ability.canManageSupportChats).toBe(true)
  })

  test('staff permissions depend on flags', () => {
    const ability = createAdminAbility(baseSession('STAFF'), {
      ...defaultStaffPermissions,
      canManageUsers: true,
      canEditAccess: true,
    })

    expect(ability.isAdmin).toBe(false)
    expect(ability.isStaff).toBe(true)
    expect(ability.canVisitAdminPanel).toBe(true)
    expect(ability.canManageUsers).toBe(true)
    expect(ability.canEditAccess).toBe(true)
    expect(ability.canGrantAccess).toBe(false)
    expect(ability.canManageSupportChats).toBe(false)
  })

  test('user has no admin permissions', () => {
    const ability = createAdminAbility(baseSession('USER'), defaultStaffPermissions)

    expect(ability.isAdmin).toBe(false)
    expect(ability.isStaff).toBe(false)
    expect(ability.canVisitAdminPanel).toBe(false)
    expect(ability.canManageUsers).toBe(false)
    expect(ability.canGrantAccess).toBe(false)
    expect(ability.canManageSupportChats).toBe(false)
  })
})
