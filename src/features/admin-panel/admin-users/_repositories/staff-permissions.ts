import { StaffPermission } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient } from '@/shared/lib/db'

@injectable()
export class StaffPermissionRepository {
  async findByUserId(userId: string): Promise<StaffPermission | null> {
    return dbClient.staffPermission.findUnique({
      where: { userId },
    })
  }

  async upsert(userId: string, data: Partial<StaffPermission>) {
    return dbClient.staffPermission.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    })
  }
}
