import { Prisma, ChatMessageSenderType } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { ChatMessageEntity } from '../_domain/types'

type CreateChatMessageInput = {
  dialogId: string
  senderType: ChatMessageSenderType
  senderUserId?: string | null
  senderStaffId?: string | null
  text?: string | null
  attachments?: Prisma.InputJsonValue
}

type ListChatMessagesInput = {
  dialogId: string
  cursor?: string
  limit?: number
}

type ListChatMessagesResult = {
  items: ChatMessageEntity[]
  nextCursor?: string
}

@injectable()
export class ChatMessageRepository {
  async create(
    input: CreateChatMessageInput,
    db: DbClient = dbClient
  ): Promise<ChatMessageEntity> {
    const record = await db.chatMessage.create({
      data: {
        dialogId: input.dialogId,
        senderType: input.senderType,
        senderUserId: input.senderUserId ?? null,
        senderStaffId: input.senderStaffId ?? null,
        text: input.text ?? null,
        attachments: input.attachments,
      },
    })

    return this.toEntity(record)
  }

  async listByDialog(
    input: ListChatMessagesInput,
    db: DbClient = dbClient
  ): Promise<ListChatMessagesResult> {
    const limit = input.limit ?? 30
    const records = await db.chatMessage.findMany({
      where: { dialogId: input.dialogId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(input.cursor
        ? {
            skip: 1,
            cursor: { id: input.cursor },
          }
        : {}),
    })

    const hasNextPage = records.length > limit
    const pageItems = hasNextPage ? records.slice(0, limit) : records
    const nextCursor = hasNextPage ? pageItems.at(-1)?.id : undefined

    return {
      items: pageItems.map(record => this.toEntity(record)),
      nextCursor,
    }
  }

  async countDialogUnreadMessages(
    dialogId: string,
    senderType: ChatMessageSenderType,
    since: Date | null,
    db: DbClient = dbClient
  ): Promise<number> {
    const count = await db.chatMessage.count({
      where: {
        dialogId,
        senderType,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
    })

    return count
  }

  private toEntity(record: {
    id: string
    dialogId: string
    senderType: ChatMessageSenderType
    senderUserId: string | null
    senderStaffId: string | null
    text: string | null
    attachments: unknown
    createdAt: Date
  }): ChatMessageEntity {
    return {
      id: record.id,
      dialogId: record.dialogId,
      senderType: record.senderType,
      senderUserId: record.senderUserId,
      senderStaffId: record.senderStaffId,
      text: record.text,
      attachments: record.attachments,
      createdAt: record.createdAt,
    }
  }
}
