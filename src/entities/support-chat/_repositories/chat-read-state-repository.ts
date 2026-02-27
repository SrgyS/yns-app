import { ChatMessageSenderType, SupportReadType } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { ChatReadStateEntity } from '../_domain/types'

type UpsertChatReadStateInput = {
  dialogId: string
  readerType: SupportReadType
  readerUserId: string
  lastReadMessageId?: string | null
  readAt?: Date | null
}

@injectable()
export class ChatReadStateRepository {
  async upsert(
    input: UpsertChatReadStateInput,
    db: DbClient = dbClient
  ): Promise<ChatReadStateEntity> {
    const record = await db.supportReadState.upsert({
      where: {
        dialogId_readerType_readerUserId: {
          dialogId: input.dialogId,
          readerType: input.readerType,
          readerUserId: input.readerUserId,
        },
      },
      create: {
        dialogId: input.dialogId,
        readerType: input.readerType,
        readerUserId: input.readerUserId,
        lastReadMessageId: input.lastReadMessageId ?? null,
        readAt: input.readAt ?? null,
      },
      update: {
        lastReadMessageId: input.lastReadMessageId ?? null,
        readAt: input.readAt ?? null,
      },
    })

    return this.toEntity(record)
  }

  async findByDialogAndReader(
    dialogId: string,
    readerType: SupportReadType,
    readerUserId: string,
    db: DbClient = dbClient
  ): Promise<ChatReadStateEntity | null> {
    const record = await db.supportReadState.findUnique({
      where: {
        dialogId_readerType_readerUserId: {
          dialogId,
          readerType,
          readerUserId,
        },
      },
    })

    if (record) {
      return this.toEntity(record)
    }

    return null
  }

  async countUnreadForUser(
    dialogId: string,
    userReadAt: Date | null,
    db: DbClient = dbClient
  ): Promise<number> {
    return this.countUnread(dialogId, 'STAFF', userReadAt, db)
  }

  async countUnreadForStaff(
    dialogId: string,
    staffReadAt: Date | null,
    db: DbClient = dbClient
  ): Promise<number> {
    return this.countUnread(dialogId, 'USER', staffReadAt, db)
  }

  private async countUnread(
    dialogId: string,
    senderType: ChatMessageSenderType,
    readAt: Date | null,
    db: DbClient
  ): Promise<number> {
    const count = await db.chatMessage.count({
      where: {
        dialogId,
        senderType,
        ...(readAt ? { createdAt: { gt: readAt } } : {}),
      },
    })

    return count
  }

  private toEntity(record: {
    id: string
    dialogId: string
    readerType: SupportReadType
    readerUserId: string
    lastReadMessageId: string | null
    readAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): ChatReadStateEntity {
    return {
      id: record.id,
      dialogId: record.dialogId,
      readerType: record.readerType,
      readerUserId: record.readerUserId,
      lastReadMessageId: record.lastReadMessageId,
      readAt: record.readAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
