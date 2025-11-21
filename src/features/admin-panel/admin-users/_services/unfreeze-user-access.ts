import { injectable } from 'inversify'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { differenceInCalendarDays, subDays } from 'date-fns'

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

    const freezeDays = differenceInCalendarDays(target.end, target.start) + 1

    const expiresAt =
      access.expiresAt == null ? null : subDays(access.expiresAt, freezeDays)

    const freezeDaysUsed = Math.max(
      (access.freezeDaysUsed ?? 0) - freezeDays,
      0
    )

    await this.userAccessRepository.save(
      {
        ...access,
        freezes: remainingFreezes,
        expiresAt,
        freezeDaysUsed,
      },
      {
        action: 'freeze_cancel',
        payload: {
          freezeId: target.id,
          removedStart: target.start,
          removedEnd: target.end,
          removedDays: freezeDays,
          newExpiresAt: expiresAt,
        },
      }
    )
  }
}
