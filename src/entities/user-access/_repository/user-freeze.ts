import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { UserId } from '@/kernel/domain/user'
import { UserFreeze } from '../_domain/type'

type CreateUserFreeze = {
  userId: UserId
  start: Date
  end: Date
  createdBy?: string | null
}

@injectable()
export class UserFreezeRepository {
  async create(
    freeze: CreateUserFreeze,
    db: DbClient = dbClient
  ): Promise<UserFreeze> {
    const record = await db.userFreeze.create({
      data: {
        userId: freeze.userId,
        start: freeze.start,
        end: freeze.end,
        createdBy: freeze.createdBy ?? null,
      },
    })

    return this.toDomain(record)
  }

  async cancel(
    freezeId: string,
    canceledBy?: string | null,
    db: DbClient = dbClient
  ): Promise<UserFreeze | null> {
    const record = await db.userFreeze.update({
      where: { id: freezeId },
      data: {
        canceledAt: new Date(),
        canceledBy: canceledBy ?? null,
      },
    })

    return record ? this.toDomain(record) : null
  }

  async findById(
    freezeId: string,
    db: DbClient = dbClient
  ): Promise<UserFreeze | null> {
    const record = await db.userFreeze.findUnique({
      where: { id: freezeId },
    })

    return record ? this.toDomain(record) : null
  }

  async findActive(
    userId: UserId,
    now: Date = new Date(),
    db: DbClient = dbClient
  ): Promise<UserFreeze | null> {
    const record = await db.userFreeze.findFirst({
      where: {
        userId,
        start: { lte: now },
        end: { gte: now },
        canceledAt: null,
      },
      orderBy: { start: 'desc' },
    })

    return record ? this.toDomain(record) : null
  }

  async findByUser(
    userId: UserId,
    db: DbClient = dbClient
  ): Promise<UserFreeze[]> {
    const records = await db.userFreeze.findMany({
      where: { userId },
      orderBy: { start: 'desc' },
    })

    return records.map(record => this.toDomain(record))
  }

  private toDomain(record: {
    id: string
    userId: string
    start: Date
    end: Date
    createdBy: string | null
    createdAt: Date
    canceledAt: Date | null
    canceledBy: string | null
  }): UserFreeze {
    return {
      id: record.id,
      userId: record.userId,
      start: record.start,
      end: record.end,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      canceledAt: record.canceledAt,
      canceledBy: record.canceledBy,
    }
  }
}
