import { injectable } from 'inversify'
import { addDays, differenceInCalendarDays, isAfter, isBefore } from 'date-fns'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { generateId } from '@/shared/lib/id'

type FreezeParams = {
  accessId: string
  adminId: string
  start: Date
  end: Date
}

@injectable()
export class FreezeUserAccessService {
  constructor(private readonly userAccessRepository: UserAccessRepository) {}

  async exec(params: FreezeParams) {
    const access = await this.userAccessRepository.findById(params.accessId)
    if (!access) {
      throw new Error('Доступ не найден')
    }

    if (isAfter(params.start, params.end)) {
      throw new Error('Дата начала позже даты окончания')
    }

    const freezes = access.freezes ?? []

    const overlaps = freezes.some(freeze =>
      // пересечения диапазонов [start, end]
      !(isBefore(params.end, freeze.start) || isAfter(params.start, freeze.end))
    )

    if (overlaps) {
      throw new Error('Период заморозки пересекается с существующим')
    }

    const freezeDays = differenceInCalendarDays(params.end, params.start) + 1
    const newExpiresAt =
      access.expiresAt == null ? null : addDays(access.expiresAt, freezeDays)

    const updatedFreezes = [
      ...freezes,
      {
        id: generateId(),
        start: params.start,
        end: params.end,
        createdBy: params.adminId,
        createdAt: new Date(),
      },
    ]

    await this.userAccessRepository.save(
      {
        ...access,
        expiresAt: newExpiresAt,
        freezes: updatedFreezes,
        freezeDaysUsed: (access.freezeDaysUsed ?? 0) + freezeDays,
      },
      {
        action: 'freeze',
        payload: {
          start: params.start,
          end: params.end,
          addedDays: freezeDays,
        },
      }
    )
  }
}
