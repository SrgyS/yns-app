import { SupportMessageSenderType, SupportReadType } from '@prisma/client'

export type SupportDialogEntity = {
  id: string
  userId: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export type SupportMessageEntity = {
  id: string
  dialogId: string
  senderType: SupportMessageSenderType
  senderUserId: string | null
  senderStaffId: string | null
  text: string | null
  attachments: unknown
  createdAt: Date
}

export type SupportReadStateEntity = {
  id: string
  dialogId: string
  readerType: SupportReadType
  readerUserId: string
  lastReadMessageId: string | null
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}
