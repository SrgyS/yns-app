import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { SupportDialogEntity } from '../_domain/types'

type CreateSupportDialogInput = {
  userId: string
  lastMessageAt?: Date
}

@injectable()
export class SupportConversationRepository {
  async create(
    input: CreateSupportDialogInput,
    db: DbClient = dbClient
  ): Promise<SupportDialogEntity> {
    const record = await db.supportDialog.create({
      data: {
        userId: input.userId,
        lastMessageAt: input.lastMessageAt,
      },
    })

    return this.toEntity(record)
  }

  async findById(
    dialogId: string,
    db: DbClient = dbClient
  ): Promise<SupportDialogEntity | null> {
    const record = await db.supportDialog.findUnique({
      where: { id: dialogId },
    })

    if (record) {
      return this.toEntity(record)
    }

    return null
  }

  async findByUserId(
    userId: string,
    db: DbClient = dbClient
  ): Promise<SupportDialogEntity[]> {
    const records = await db.supportDialog.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return records.map(record => this.toEntity(record))
  }

  async touchLastMessageAt(
    dialogId: string,
    lastMessageAt: Date,
    db: DbClient = dbClient
  ): Promise<SupportDialogEntity> {
    const record = await db.supportDialog.update({
      where: { id: dialogId },
      data: { lastMessageAt },
    })

    return this.toEntity(record)
  }

  private toEntity(record: {
    id: string
    userId: string
    lastMessageAt: Date
    createdAt: Date
    updatedAt: Date
  }): SupportDialogEntity {
    return {
      id: record.id,
      userId: record.userId,
      lastMessageAt: record.lastMessageAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
