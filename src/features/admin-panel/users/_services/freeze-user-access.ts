import { injectable } from 'inversify'
import { addDays, differenceInCalendarDays, isAfter } from 'date-fns'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { UserFreezeRepository } from '@/entities/user-access/_repository/user-freeze'

type FreezeParams = {
  accessId: string
  adminId: string
  start: Date
  end: Date
}

@injectable()
export class FreezeUserAccessService {
  constructor(
    private readonly userAccessRepository: UserAccessRepository,
    private readonly userFreezeRepository: UserFreezeRepository
  ) {}

  async exec(params: FreezeParams) {
    const access = await this.userAccessRepository.findById(params.accessId)
    if (!access) {
      throw new Error('Доступ не найден')
    }

    if (isAfter(params.start, params.end)) {
      throw new Error('Дата начала позже даты окончания')
    }

    if (access.expiresAt && params.start > access.expiresAt) {
      throw new Error('Дата начала заморозки позже даты окончания доступа')
    }

    const activeFreeze = await this.userFreezeRepository.findActive(access.userId)
    if (activeFreeze) {
      throw new Error('Есть активная заморозка')
    }

    const freezeDays = differenceInCalendarDays(params.end, params.start) + 1

    const userFreeze = await this.userFreezeRepository.create({
      userId: access.userId,
      start: params.start,
      end: params.end,
      createdBy: params.adminId,
    })

    const activeAccesses =
      await this.userAccessRepository.findActiveAccesses(access.userId)
    await Promise.all(
      activeAccesses.map(userAccess => {
        const expiresAt =
          userAccess.expiresAt == null
            ? null
            : addDays(userAccess.expiresAt, freezeDays)

        return this.userAccessRepository.save(
          { ...userAccess, expiresAt },
          {
            action: 'freeze',
            payload: {
              userFreezeId: userFreeze.id,
              start: params.start,
              end: params.end,
              addedDays: freezeDays,
            },
          }
        )
      })
    )
  }
}
