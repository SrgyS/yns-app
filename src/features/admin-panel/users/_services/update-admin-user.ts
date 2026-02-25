import { ROLE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { injectable } from 'inversify'

import { StaffPermissionRepository } from '../_repositories/staff-permissions'
import { dbClient } from '@/shared/lib/db'
import {
  StaffPermissionFlags,
  defaultPermissionsByRole,
} from '../_domain/staff-permission'

type UpdateAdminUserInput = {
  userId: string
  role?: ROLE
  permissions?: Partial<StaffPermissionFlags>
}

@injectable()
export class UpdateAdminUserService {
  constructor(
    private readonly staffPermissionRepository: StaffPermissionRepository
  ) {}

  async exec(input: UpdateAdminUserInput) {
    const user = await dbClient.user.findUnique({
      where: { id: input.userId },
      select: { role: true },
    })

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Пользователь не найден' })
    }

    const nextRole = input.role ?? user.role

    if (input.role && input.role !== user.role) {
      await dbClient.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      })

      if (input.role === 'ADMIN') {
        await this.staffPermissionRepository.deleteByUserId(input.userId)
      }

      if (input.role === 'USER') {
        await this.staffPermissionRepository.deleteByUserId(input.userId)
      }
    }

    if (!input.permissions) {
      return
    }

    if (nextRole !== 'STAFF') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Права можно задать только для роли STAFF',
      })
    }

    const current =
      (await this.staffPermissionRepository.findByUserId(input.userId)) ??
      defaultPermissionsByRole.STAFF

    const merged: StaffPermissionFlags = {
      canViewPayments:
        input.permissions.canViewPayments ?? current.canViewPayments,
      canEditAccess: input.permissions.canEditAccess ?? current.canEditAccess,
      canManageUsers:
        input.permissions.canManageUsers ?? current.canManageUsers,
      canGrantAccess:
        input.permissions.canGrantAccess ?? current.canGrantAccess,
      canLoginAsUser:
        input.permissions.canLoginAsUser ?? current.canLoginAsUser,
      canManageCourses:
        input.permissions.canManageCourses ?? current.canManageCourses,
      canManageSupportChats:
        input.permissions.canManageSupportChats ??
        current.canManageSupportChats,
    }

    await this.staffPermissionRepository.upsert(input.userId, merged)
  }
}
