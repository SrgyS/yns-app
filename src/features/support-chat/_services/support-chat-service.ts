import {
  Prisma,
  ROLE,
  ChatMessageSenderType,
  SupportReadType,
} from '@prisma/client'
import { injectable } from 'inversify'

import {
  ChatAttachmentRepository,
  ChatDialogRepository,
  ChatMessageRepository,
  ChatReadStateRepository,
} from '@/entities/support-chat/module'
import { dbClient } from '@/shared/lib/db'
import { sanitizeFileName } from '@/shared/lib/file-storage/utils'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { logger } from '@/shared/lib/logger'
import { createSupportChatError } from '../_domain/errors'
import { assertAttachmentMimeType } from '../_domain/attachment-schema'
import { SupportChatReadService } from './support-chat-read-service'
import { TelegramSupportNotifier } from '../_integrations/telegram-support-notifier'
import { publishSupportChatEvent } from '../_integrations/support-chat-events'

type SupportChatActor = {
  id: string
  role: ROLE
}

type ListDialogsInput = {
  actor: SupportChatActor
  cursor?: string
  limit?: number
}

type UserMessagesInput = {
  actor: SupportChatActor
  dialogId: string
  cursor?: string
  limit?: number
}

type StaffListDialogsInput = ListDialogsInput & {
  hasUnansweredIncoming?: boolean
}

type SendMessageInput = {
  actor: SupportChatActor
  dialogId: string
  text?: string
  attachments?: SupportChatAttachmentInput[]
}

type MarkDialogReadInput = {
  actor: SupportChatActor
  dialogId: string
  lastReadMessageId: string
}

type CreateDialogInput = {
  actor: SupportChatActor
  topic?: string
  initialMessage: string
  attachments?: SupportChatAttachmentInput[]
}

type SupportChatAttachmentInput = {
  filename: string
  mimeType: string
  sizeBytes: number
  base64: string
}

type UploadedChatAttachment = {
  id: string
  name: string
  path: string
  type: string
  sizeBytes: number
}

@injectable()
export class SupportChatService {
  constructor(
    private readonly attachmentRepository: ChatAttachmentRepository,
    private readonly conversationRepository: ChatDialogRepository,
    private readonly messageRepository: ChatMessageRepository,
    private readonly readStateRepository: ChatReadStateRepository,
    private readonly readService: SupportChatReadService,
    private readonly telegramSupportNotifier: TelegramSupportNotifier
  ) {}

  async userListDialogs(input: ListDialogsInput) {
    this.ensureUserRole(input.actor)

    const limit = input.limit ?? 20
    const rows = await dbClient.chatDialog.findMany({
      where: {
        userId: input.actor.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit + 1,
      ...(input.cursor
        ? {
            skip: 1,
            cursor: {
              id: input.cursor,
            },
          }
        : {}),
    })

    const hasNextPage = rows.length > limit
    const pageItems = hasNextPage ? rows.slice(0, limit) : rows
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : undefined

    const items = await Promise.all(
      pageItems.map(async dialog => {
        const [lastMessage, unreadCount] = await Promise.all([
          dbClient.chatMessage.findFirst({
            where: {
              dialogId: dialog.id,
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              text: true,
              createdAt: true,
            },
          }),
          this.readService.countUnreadForUser(dialog.id, input.actor.id),
        ])

        return {
          dialogId: dialog.id,
          title: 'Диалог с поддержкой',
          lastMessagePreview: lastMessage?.text ?? null,
          unreadCount,
          updatedAt: dialog.updatedAt,
        }
      })
    )

    return {
      items,
      nextCursor,
    }
  }

  async userGetMessages(input: UserMessagesInput) {
    const dialog = await this.assertDialogAccess(input.dialogId, input.actor)

    const limit = input.limit ?? 20
    const page = await this.messageRepository.listByDialog({
      dialogId: dialog.id,
      cursor: input.cursor,
      limit,
    })

    const readerType = this.resolveReaderType(input.actor.role)
    const readState = await this.readStateRepository.findByDialogAndReader(
      dialog.id,
      readerType,
      input.actor.id
    )

    const items = page.items.map(item => {
      const readAt =
        readState?.readAt && item.createdAt <= readState.readAt
          ? readState.readAt
          : null

      return {
        id: item.id,
        dialogId: item.dialogId,
        senderType: item.senderType,
        text: item.text,
        attachments: item.attachments,
        createdAt: item.createdAt,
        readAt,
      }
    })

    return {
      items,
      nextCursor: page.nextCursor,
    }
  }

  async staffListDialogs(input: StaffListDialogsInput) {
    await this.ensureStaffAccess(input.actor)

    const limit = input.limit ?? 20
    const rows = await dbClient.chatDialog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: limit + 1,
      ...(input.cursor
        ? {
            skip: 1,
            cursor: {
              id: input.cursor,
            },
          }
        : {}),
    })

    const hasNextPage = rows.length > limit
    const pageItems = hasNextPage ? rows.slice(0, limit) : rows

    const mapped = await Promise.all(
      pageItems.map(async dialog => {
        const [unreadCount, hasUnansweredIncoming] = await Promise.all([
          this.readService.countUnreadForStaff(dialog.id, input.actor.id),
          this.readService.hasUnansweredIncoming(dialog.id),
        ])

        return {
          dialogId: dialog.id,
          user: {
            id: dialog.user.id,
            name: dialog.user.name,
          },
          unreadCount,
          hasUnansweredIncoming,
          lastMessageAt: dialog.lastMessageAt,
        }
      })
    )

    const items = mapped.filter(item => {
      if (input.hasUnansweredIncoming === undefined) {
        return true
      }

      return item.hasUnansweredIncoming === input.hasUnansweredIncoming
    })

    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id : undefined

    return {
      items,
      nextCursor,
    }
  }

  async sendMessage(input: SendMessageInput) {
    const dialog = await this.assertDialogAccess(input.dialogId, input.actor)
    const normalizedText = input.text?.trim()
    const hasText = Boolean(normalizedText)
    const hasAttachments = Array.isArray(input.attachments) && input.attachments.length > 0

    if (!hasText && !hasAttachments) {
      throw createSupportChatError('INVALID_MESSAGE')
    }

    const uploadedAttachments = await this.uploadAttachments(
      input.attachments,
      dialog.id,
      dialog.userId
    )

    const now = new Date()
    const message = await this.messageRepository.create({
      dialogId: dialog.id,
      senderType: this.resolveSenderType(input.actor.role),
      senderUserId: input.actor.role === 'USER' ? input.actor.id : null,
      senderStaffId: input.actor.role !== 'USER' ? input.actor.id : null,
      text: normalizedText ?? null,
      attachments: uploadedAttachments as Prisma.InputJsonValue,
    })
    await this.linkUploadedAttachmentsToMessage(
      dialog.id,
      message.id,
      uploadedAttachments
    )

    await this.conversationRepository.touchLastMessageAt(dialog.id, now)

    const [userUnread, staffUnread] = await Promise.all([
      this.readService.countUnreadForUser(dialog.id, dialog.userId),
      this.readService.countUnreadForStaff(dialog.id, input.actor.id),
    ])

    const result = {
      message: {
        id: message.id,
        dialogId: message.dialogId,
        senderType: message.senderType,
        text: message.text,
        attachments: message.attachments,
        createdAt: message.createdAt,
      },
      dialog: {
        dialogId: dialog.id,
        updatedAt: now,
      },
      unread: {
        user: userUnread,
        staff: staffUnread,
      },
    }

    publishSupportChatEvent({
      type: 'message.created',
      dialogId: dialog.id,
      userId: dialog.userId,
      occurredAt: now.toISOString(),
    })

    if (message.senderType === 'USER') {
      this.telegramSupportNotifier
        .notifyNewUserMessage({
          dialogId: dialog.id,
          userId: dialog.userId,
          messageText: message.text,
          attachmentCount: uploadedAttachments.length,
        })
        .catch(error => {
          logger.warn({
            msg: 'Failed to notify support chat message in Telegram',
            dialogId: dialog.id,
            userId: dialog.userId,
            error,
          })
        })
    }

    return result
  }

  async markDialogRead(input: MarkDialogReadInput) {
    const dialog = await this.assertDialogAccess(input.dialogId, input.actor)

    const message = await dbClient.chatMessage.findFirst({
      where: {
        id: input.lastReadMessageId,
        dialogId: dialog.id,
      },
      select: {
        createdAt: true,
      },
    })

    if (!message) {
      throw createSupportChatError('MESSAGE_NOT_FOUND')
    }

    const readerType = this.resolveReaderType(input.actor.role)
    const readState = await this.readStateRepository.upsert({
      dialogId: dialog.id,
      readerType,
      readerUserId: input.actor.id,
      lastReadMessageId: input.lastReadMessageId,
      readAt: message.createdAt,
    })

    let unreadCount = 0
    if (readerType === 'USER') {
      unreadCount = await this.readService.countUnreadForUser(dialog.id, input.actor.id)
    }

    if (readerType === 'STAFF') {
      unreadCount = await this.readService.countUnreadForStaff(dialog.id, input.actor.id)
    }

    const result = {
      dialogId: dialog.id,
      readerType,
      readAt: readState.readAt,
      unreadCount,
    }

    publishSupportChatEvent({
      type: 'read.updated',
      dialogId: dialog.id,
      userId: dialog.userId,
      occurredAt: new Date().toISOString(),
    })

    return result
  }

  async createDialog(input: CreateDialogInput) {
    this.ensureUserRole(input.actor)

    const normalizedMessage = input.initialMessage.trim()
    const hasText = normalizedMessage.length > 0
    const hasAttachments = Array.isArray(input.attachments) && input.attachments.length > 0

    if (!hasText && !hasAttachments) {
      throw createSupportChatError('INVALID_MESSAGE')
    }

    const now = new Date()
    const dialog = await this.conversationRepository.create({
      userId: input.actor.id,
      lastMessageAt: now,
    })
    const uploadedAttachments = await this.uploadAttachments(
      input.attachments,
      dialog.id,
      input.actor.id
    )
    const message = await this.messageRepository.create({
      dialogId: dialog.id,
      senderType: 'USER',
      senderUserId: input.actor.id,
      text: hasText ? normalizedMessage : null,
      attachments: uploadedAttachments as Prisma.InputJsonValue,
    })
    await this.linkUploadedAttachmentsToMessage(
      dialog.id,
      message.id,
      uploadedAttachments
    )

    const result = {
      dialogId: dialog.id,
      createdAt: dialog.createdAt,
      firstMessageId: message.id,
    }

    const occurredAt = result.createdAt.toISOString()
    publishSupportChatEvent({
      type: 'dialog.created',
      dialogId: result.dialogId,
      userId: input.actor.id,
      occurredAt,
    })
    publishSupportChatEvent({
      type: 'message.created',
      dialogId: result.dialogId,
      userId: input.actor.id,
      occurredAt,
    })

    this.telegramSupportNotifier
      .notifyNewUserMessage({
        dialogId: result.dialogId,
        userId: input.actor.id,
        messageText: hasText ? normalizedMessage : null,
        attachmentCount: uploadedAttachments.length,
      })
      .catch(error => {
        logger.warn({
          msg: 'Failed to notify support chat dialog in Telegram',
          dialogId: result.dialogId,
          userId: input.actor.id,
          error,
        })
      })

    return result
  }

  private async assertDialogAccess(dialogId: string, actor: SupportChatActor) {
    const dialog = await this.conversationRepository.findById(dialogId)

    if (!dialog) {
      throw createSupportChatError('DIALOG_NOT_FOUND')
    }

    if (actor.role === 'USER') {
      if (dialog.userId !== actor.id) {
        throw createSupportChatError('DIALOG_ACCESS_DENIED')
      }

      return dialog
    }

    if (actor.role === 'ADMIN') {
      return dialog
    }

    if (actor.role === 'STAFF') {
      await this.ensureStaffAccess(actor)
      return dialog
    }

    throw createSupportChatError('DIALOG_ACCESS_DENIED')
  }

  private async ensureStaffAccess(actor: SupportChatActor) {
    if (actor.role === 'ADMIN') {
      return
    }

    if (actor.role !== 'STAFF') {
      throw createSupportChatError('STAFF_PERMISSION_DENIED')
    }

    const permission = await dbClient.staffPermission.findUnique({
      where: {
        userId: actor.id,
      },
      select: {
        canManageSupportChats: true,
      },
    })

    if (permission?.canManageSupportChats) {
      return
    }

    throw createSupportChatError('STAFF_PERMISSION_DENIED')
  }

  private ensureUserRole(actor: SupportChatActor) {
    if (actor.role === 'USER') {
      return
    }

    throw createSupportChatError('DIALOG_ACCESS_DENIED')
  }

  private resolveSenderType(role: ROLE): ChatMessageSenderType {
    if (role === 'USER') {
      return 'USER'
    }

    return 'STAFF'
  }

  private resolveReaderType(role: ROLE): SupportReadType {
    if (role === 'USER') {
      return 'USER'
    }

    return 'STAFF'
  }

  private async uploadAttachments(
    attachments: SupportChatAttachmentInput[] | undefined,
    dialogId: string,
    ownerUserId: string
  ): Promise<UploadedChatAttachment[]> {
    if (!attachments || attachments.length === 0) {
      return []
    }

    const uploaded = await Promise.all(
      attachments.map(async attachment => {
        try {
          assertAttachmentMimeType(attachment.mimeType)
        } catch {
          throw createSupportChatError('INVALID_MESSAGE')
        }

        const bytes = this.decodeAttachment(attachment.base64)
        if (bytes.byteLength !== attachment.sizeBytes) {
          throw createSupportChatError('INVALID_MESSAGE')
        }

        const safeName =
          sanitizeFileName(attachment.filename) === attachment.filename
            ? attachment.filename
            : sanitizeFileName(attachment.filename)
        const file = new File([bytes], safeName, {
          type: attachment.mimeType,
        })

        const stored = await fileStorage.uploadFile(
          file,
          'support-chat',
          ownerUserId,
          'private'
        )
        const uploadedAttachment = await this.attachmentRepository.createUploaded({
          dialogId,
          storagePath: stored.path,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          originalName: safeName,
          createdByUserId: ownerUserId,
          etag: stored.eTag ?? null,
          lastModified: null,
        })

        return {
          id: uploadedAttachment.id,
          name: stored.name,
          path: stored.path,
          type: stored.type,
          sizeBytes: attachment.sizeBytes,
        }
      })
    )

    return uploaded
  }

  private async linkUploadedAttachmentsToMessage(
    dialogId: string,
    messageId: string,
    attachments: UploadedChatAttachment[]
  ): Promise<void> {
    if (attachments.length === 0) {
      return
    }

    await Promise.all(
      attachments.map(async attachment => {
        const linked = await this.attachmentRepository.linkToMessage({
          id: attachment.id,
          dialogId,
          messageId,
        })

        if (!linked) {
          throw new Error('Failed to link uploaded attachment to message')
        }
      })
    )
  }

  private decodeAttachment(base64Data: string): ArrayBuffer {
    try {
      const commaIndex = base64Data.indexOf(',')
      const normalized = commaIndex >= 0 ? base64Data.slice(commaIndex + 1) : base64Data
      const buffer = Buffer.from(normalized, 'base64')
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      )

      return arrayBuffer
    } catch {
      throw createSupportChatError('INVALID_MESSAGE')
    }
  }
}
