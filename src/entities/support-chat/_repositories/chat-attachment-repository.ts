import { ChatAttachmentStatus } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient, type DbClient } from '@/shared/lib/db'
import { ChatAttachmentEntity } from '../_domain/types'

type CreateUploadedChatAttachmentInput = {
  dialogId: string
  storagePath: string
  mimeType: string
  sizeBytes: number
  originalName: string
  createdByUserId: string
  etag?: string | null
  lastModified?: Date | null
}

type LinkChatAttachmentToMessageInput = {
  id: string
  dialogId: string
  messageId: string
}

@injectable()
export class ChatAttachmentRepository {
  async createUploaded(
    input: CreateUploadedChatAttachmentInput,
    db: DbClient = dbClient
  ): Promise<ChatAttachmentEntity> {
    const record = await db.chatAttachment.create({
      data: {
        dialogId: input.dialogId,
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        originalName: input.originalName,
        createdByUserId: input.createdByUserId,
        status: 'UPLOADED',
        etag: input.etag ?? null,
        lastModified: input.lastModified ?? null,
      },
    })

    return this.toEntity(record)
  }

  async linkToMessage(
    input: LinkChatAttachmentToMessageInput,
    db: DbClient = dbClient
  ): Promise<ChatAttachmentEntity | null> {
    const record = await db.chatAttachment.findUnique({
      where: {
        id: input.id,
      },
    })

    if (!record) {
      return null
    }

    if (record.dialogId !== input.dialogId) {
      return null
    }

    const updated = await db.chatAttachment.update({
      where: {
        id: input.id,
      },
      data: {
        messageId: input.messageId,
        status: 'LINKED',
      },
    })

    return this.toEntity(updated)
  }

  async findByDialogAndId(
    dialogId: string,
    attachmentId: string,
    db: DbClient = dbClient
  ): Promise<ChatAttachmentEntity | null> {
    const record = await db.chatAttachment.findFirst({
      where: {
        id: attachmentId,
        dialogId,
      },
    })

    if (!record) {
      return null
    }

    return this.toEntity(record)
  }

  async listStaleUploaded(
    olderThan: Date,
    limit = 100,
    db: DbClient = dbClient
  ): Promise<ChatAttachmentEntity[]> {
    const records = await db.chatAttachment.findMany({
      where: {
        status: 'UPLOADED',
        createdAt: {
          lt: olderThan,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    })

    return records.map(record => this.toEntity(record))
  }

  async deleteByIds(
    ids: string[],
    db: DbClient = dbClient
  ): Promise<number> {
    if (ids.length === 0) {
      return 0
    }

    const result = await db.chatAttachment.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return result.count
  }

  private toEntity(record: {
    id: string
    dialogId: string
    messageId: string | null
    storagePath: string
    mimeType: string
    sizeBytes: number
    originalName: string
    createdByUserId: string
    status: ChatAttachmentStatus
    etag: string | null
    lastModified: Date | null
    createdAt: Date
    updatedAt: Date
  }): ChatAttachmentEntity {
    return {
      id: record.id,
      dialogId: record.dialogId,
      messageId: record.messageId,
      storagePath: record.storagePath,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      originalName: record.originalName,
      createdByUserId: record.createdByUserId,
      status: record.status,
      etag: record.etag,
      lastModified: record.lastModified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
