import { injectable } from 'inversify'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'

type ExtendParams = {
  accessId: string
  adminId: string
  expiresAt: Date
}

@injectable()
export class ExtendUserAccessService {
  constructor(private readonly userAccessRepository: UserAccessRepository) {}

  async exec(params: ExtendParams) {
    const currentAccess = await this.userAccessRepository.findById(
      params.accessId
    )

    if (!currentAccess) {
      throw new Error('Доступ не найден')
    }

    if (!params.expiresAt) {
      throw new Error('Новая дата окончания не заполнена')
    }

    if (params.expiresAt.getTime() <= Date.now()) {
      throw new Error('Дата окончания должна быть в будущем')
    }

    await this.userAccessRepository.save(
      {
        ...currentAccess,
        adminId: params.adminId,
        expiresAt: params.expiresAt,
      },
      {
        action: 'extend',
        payload: {
          previousExpiresAt: currentAccess.expiresAt,
          newExpiresAt: params.expiresAt,
        },
      }
    )
  }
}
