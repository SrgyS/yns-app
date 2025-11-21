import { injectable } from 'inversify'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'

type UnfreezeParams = {
  accessId: string
  freezeId: string
  adminId: string
}

@injectable()
export class UnfreezeUserAccessService {
  constructor(private readonly userAccessRepository: UserAccessRepository) {}

  async exec(params: UnfreezeParams) {
    const access = await this.userAccessRepository.findById(params.accessId)
    if (!access) {
      throw new Error('Доступ не найден')
    }

    const existingFreezes = access.freezes ?? []
    const target = existingFreezes.find(freeze => freeze.id === params.freezeId)

    if (!target) {
      throw new Error('Период заморозки не найден')
    }

    const remainingFreezes = existingFreezes.filter(
      freeze => freeze.id !== params.freezeId
    )

    await this.userAccessRepository.save(
      {
        ...access,
        freezes: remainingFreezes,
      },
      {
        action: 'freeze_cancel',
        payload: {
          freezeId: target.id,
          removedStart: target.start,
          removedEnd: target.end,
        },
      }
    )
  }
}
