import { ROLE } from '@prisma/client'
import { injectable } from 'inversify'

import {
  defaultPermissionsByRole,
  StaffPermissionFlags,
} from '../_domain/staff-permission'
import { StaffPermissionRepository } from '../_repositories/staff-permission-repository'

type Subject = {
  id: string
  role: ROLE
}

@injectable()
export class StaffPermissionService {
  constructor(
    private readonly staffPermissionRepository: StaffPermissionRepository
  ) {}

  async getPermissionsForUser(user: Subject): Promise<StaffPermissionFlags> {
    const basePermissions = defaultPermissionsByRole[user.role]

    if (user.role !== 'STAFF') {
      return basePermissions
    }

    const stored = await this.staffPermissionRepository.findByUserId(user.id)

    if (!stored) {
      return basePermissions
    }

    return {
      canViewPayments: stored.canViewPayments,
      canEditAccess: stored.canEditAccess,
      canManageUsers: stored.canManageUsers,
      canGrantAccess: stored.canGrantAccess,
    }
  }
}
