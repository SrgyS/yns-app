import {
  ChatAttachmentStatus,
  ChatMessageSenderType,
  SupportReadType,
} from '@prisma/client'

export type ChatDialogEntity = {
  id: string
  userId: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export type ChatMessageEntity = {
  id: string
  dialogId: string
  senderType: ChatMessageSenderType
  senderUserId: string | null
  senderStaffId: string | null
  text: string | null
  attachments: unknown
  createdAt: Date
}

export type ChatReadStateEntity = {
  id: string
  dialogId: string
  readerType: SupportReadType
  readerUserId: string
  lastReadMessageId: string | null
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ChatAttachmentEntity = {
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
}
