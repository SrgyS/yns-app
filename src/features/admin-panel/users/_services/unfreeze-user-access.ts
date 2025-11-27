import { injectable } from 'inversify'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { UserFreezeRepository } from '@/entities/user-access/_repository/user-freeze'
import { differenceInCalendarDays, subDays } from 'date-fns'

type UnfreezeParams = {
  accessId: string
  freezeId: string
  adminId: string
}

@injectable()
export class UnfreezeUserAccessService {
  constructor(
    private readonly userAccessRepository: UserAccessRepository,
    private readonly userFreezeRepository: UserFreezeRepository
  ) {}

  async exec(params: UnfreezeParams) {
    const access = await this.userAccessRepository.findById(params.accessId)
    if (!access) {
      throw new Error('Доступ не найден')
    }

    const target = await this.userFreezeRepository.findById(params.freezeId)
    if (!target || target.userId !== access.userId) {
      throw new Error('Период заморозки не найден')
    }

    if (target.canceledAt) {
      throw new Error('Период заморозки уже отменён')
    }

    const freezeDays = differenceInCalendarDays(target.end, target.start) + 1

    const canceledFreeze = await this.userFreezeRepository.cancel(
      params.freezeId,
      params.adminId
    )

    const userFreeze = canceledFreeze ?? target

    const activeAccesses =
      await this.userAccessRepository.findActiveAccesses(userFreeze.userId)
    await Promise.all(
      activeAccesses.map(userAccess => {
        const expiresAt =
          userAccess.expiresAt == null
            ? null
            : subDays(userAccess.expiresAt, freezeDays)

        return this.userAccessRepository.save(
          { ...userAccess, expiresAt },
          {
            action: 'freeze_cancel',
            payload: {
              freezeId: userFreeze.id,
              removedStart: userFreeze.start,
              removedEnd: userFreeze.end,
              removedDays: freezeDays,
              newExpiresAt: expiresAt,
            },
          }
        )
      })
    )
  }
}
