import { injectable } from 'inversify'

import { SupportReadStateRepository } from '@/entities/support-chat/module'
import { dbClient, type DbClient } from '@/shared/lib/db'

type LastMessagePair = {
  latestUserMessageAt: Date | null
  latestStaffMessageAt: Date | null
}

@injectable()
export class SupportChatReadService {
  constructor(private readonly readStateRepository: SupportReadStateRepository) {}

  async countUnreadForUser(
    dialogId: string,
    userId: string,
    db: DbClient = dbClient
  ): Promise<number> {
    const readState = await this.readStateRepository.findByDialogAndReader(
      dialogId,
      'USER',
      userId,
      db
    )

    return await this.readStateRepository.countUnreadForUser(
      dialogId,
      readState?.readAt ?? null,
      db
    )
  }

  async countUnreadForStaff(
    dialogId: string,
    staffId: string,
    db: DbClient = dbClient
  ): Promise<number> {
    const readState = await this.readStateRepository.findByDialogAndReader(
      dialogId,
      'STAFF',
      staffId,
      db
    )

    return await this.readStateRepository.countUnreadForStaff(
      dialogId,
      readState?.readAt ?? null,
      db
    )
  }

  async hasUnansweredIncoming(
    dialogId: string,
    db: DbClient = dbClient
  ): Promise<boolean> {
    const latestMessages = await this.getLatestMessagePair(dialogId, db)

    if (!latestMessages.latestUserMessageAt) {
      return false
    }

    if (!latestMessages.latestStaffMessageAt) {
      return true
    }

    return latestMessages.latestUserMessageAt > latestMessages.latestStaffMessageAt
  }

  private async getLatestMessagePair(
    dialogId: string,
    db: DbClient
  ): Promise<LastMessagePair> {
    const [latestUserMessage, latestStaffMessage] = await Promise.all([
      db.supportMessage.findFirst({
        where: {
          dialogId,
          senderType: 'USER',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      }),
      db.supportMessage.findFirst({
        where: {
          dialogId,
          senderType: 'STAFF',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      }),
    ])

    return {
      latestUserMessageAt: latestUserMessage?.createdAt ?? null,
      latestStaffMessageAt: latestStaffMessage?.createdAt ?? null,
    }
  }
}
