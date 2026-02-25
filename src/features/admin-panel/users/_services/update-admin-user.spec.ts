jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { ROLE } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import { dbClient } from '@/shared/lib/db'
import { UpdateAdminUserService } from './update-admin-user'
import { defaultPermissionsByRole } from '../_domain/staff-permission'

describe('UpdateAdminUserService', () => {
  const staffPermissionRepository = {
    deleteByUserId: jest.fn(),
    findByUserId: jest.fn(),
    upsert: jest.fn(),
  }
  const service = new UpdateAdminUserService(staffPermissionRepository as any)

  beforeEach(() => {
    ;(dbClient.user.findUnique as jest.Mock).mockReset()
    ;(dbClient.user.update as jest.Mock).mockReset()
    staffPermissionRepository.deleteByUserId.mockReset()
    staffPermissionRepository.findByUserId.mockReset()
    staffPermissionRepository.upsert.mockReset()
  })

  test('throws not found when user is missing', async () => {
    ;(dbClient.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      service.exec({ userId: 'missing' })
    ).rejects.toBeInstanceOf(TRPCError)
  })

  test('removes staff permissions when role changes to ADMIN', async () => {
    ;(dbClient.user.findUnique as jest.Mock).mockResolvedValue({
      role: ROLE.STAFF,
    })

    await service.exec({ userId: 'user-1', role: ROLE.ADMIN })

    expect(dbClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: ROLE.ADMIN },
    })
    expect(staffPermissionRepository.deleteByUserId).toHaveBeenCalledWith(
      'user-1'
    )
  })

  test('rejects permissions update when role is not STAFF', async () => {
    ;(dbClient.user.findUnique as jest.Mock).mockResolvedValue({
      role: ROLE.USER,
    })

    await expect(
      service.exec({
        userId: 'user-1',
        permissions: { canManageUsers: true },
      })
    ).rejects.toBeInstanceOf(TRPCError)
  })

  test('merges and upserts staff permissions', async () => {
    ;(dbClient.user.findUnique as jest.Mock).mockResolvedValue({
      role: ROLE.STAFF,
    })
    staffPermissionRepository.findByUserId.mockResolvedValue(null)

    await service.exec({
      userId: 'user-1',
      permissions: { canManageUsers: true, canEditAccess: true },
    })

    expect(staffPermissionRepository.upsert).toHaveBeenCalledWith('user-1', {
      ...defaultPermissionsByRole.STAFF,
      canManageUsers: true,
      canEditAccess: true,
    })
  })
})
