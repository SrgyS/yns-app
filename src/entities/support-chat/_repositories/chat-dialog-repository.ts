import { Prisma } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { ChatDialogEntity } from '../_domain/types'

type CreateChatDialogInput = {
  userId: string
  lastMessageAt?: Date
}

@injectable()
export class ChatDialogRepository {
  async create(
    input: CreateChatDialogInput,
    db: DbClient = dbClient
  ): Promise<ChatDialogEntity> {
    const record = await db.chatDialog.create({
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
  ): Promise<ChatDialogEntity | null> {
    const record = await db.chatDialog.findUnique({
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
  ): Promise<ChatDialogEntity[]> {
    const records = await db.chatDialog.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return records.map(record => this.toEntity(record))
  }

  async findByUserIdUnique(
    userId: string,
    db: DbClient = dbClient
  ): Promise<ChatDialogEntity | null> {
    const record = await db.chatDialog.findFirst({
      where: { userId },
    })

    if (record) {
      return this.toEntity(record)
    }

    return null
  }

  async createOrReturnCanonical(
    input: CreateChatDialogInput,
    db: DbClient = dbClient
  ): Promise<{ dialog: ChatDialogEntity; created: boolean }> {
    const existing = await this.findByUserIdUnique(input.userId, db)
    if (existing) {
      return {
        dialog: existing,
        created: false,
      }
    }

    try {
      const dialog = await this.create(input, db)
      return {
        dialog,
        created: true,
      }
    } catch (error) {
      const isUniqueConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'

      if (isUniqueConflict) {
        const canonical = await this.findByUserIdUnique(input.userId, db)
        if (canonical) {
          return {
            dialog: canonical,
            created: false,
          }
        }
      }

      throw error
    }
  }

  async touchLastMessageAt(
    dialogId: string,
    lastMessageAt: Date,
    db: DbClient = dbClient
  ): Promise<ChatDialogEntity> {
    const record = await db.chatDialog.update({
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
  }): ChatDialogEntity {
    return {
      id: record.id,
      userId: record.userId,
      lastMessageAt: record.lastMessageAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
