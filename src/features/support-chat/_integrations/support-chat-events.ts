import { ChatMessageSenderType } from '@prisma/client'

type SupportChatEventType =
  | 'dialog.created'
  | 'message.created'
  | 'message.updated'
  | 'read.updated'

type SupportChatEventBase = {
  dialogId: string
  userId: string
  occurredAt: string
}

export type SupportChatEvent =
  | (SupportChatEventBase & {
      type: Exclude<SupportChatEventType, 'message.created'>
    })
  | (SupportChatEventBase & {
      type: 'message.created'
      message: {
        id: string
        clientMessageId: string | null
        text: string | null
        senderType: ChatMessageSenderType
        createdAt: string
      }
    })

type Listener = (event: SupportChatEvent) => void

const listeners = new Set<Listener>()

export const publishSupportChatEvent = (event: SupportChatEvent) => {
  listeners.forEach(listener => {
    listener(event)
  })
}

export const subscribeToSupportChatEvents = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
