type SupportChatEventType = 'dialog.created' | 'message.created' | 'read.updated'

export type SupportChatEvent = {
  type: SupportChatEventType
  dialogId: string
  userId: string
  occurredAt: string
}

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
