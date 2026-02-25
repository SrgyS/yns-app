import { Prisma, SupportMessageSenderType } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { SupportMessageEntity } from '../_domain/types'

type CreateSupportMessageInput = {
  dialogId: string
  senderType: SupportMessageSenderType
  senderUserId?: string | null
  senderStaffId?: string | null
  text?: string | null
  attachments?: Prisma.InputJsonValue
}

type ListSupportMessagesInput = {
  dialogId: string
  cursor?: string
  limit?: number
}

type ListSupportMessagesResult = {
  items: SupportMessageEntity[]
  nextCursor?: string
}

@injectable()
export class SupportMessageRepository {
  async create(
    input: CreateSupportMessageInput,
    db: DbClient = dbClient
  ): Promise<SupportMessageEntity> {
    const record = await db.supportMessage.create({
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
    input: ListSupportMessagesInput,
    db: DbClient = dbClient
  ): Promise<ListSupportMessagesResult> {
    const limit = input.limit ?? 30
    const records = await db.supportMessage.findMany({
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
    senderType: SupportMessageSenderType,
    since: Date | null,
    db: DbClient = dbClient
  ): Promise<number> {
    const count = await db.supportMessage.count({
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
    senderType: SupportMessageSenderType
    senderUserId: string | null
    senderStaffId: string | null
    text: string | null
    attachments: unknown
    createdAt: Date
  }): SupportMessageEntity {
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
