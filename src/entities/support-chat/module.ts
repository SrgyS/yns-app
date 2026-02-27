import { ContainerModule } from 'inversify'

import { ChatDialogRepository } from './_repositories/chat-dialog-repository'
import { ChatAttachmentRepository } from './_repositories/chat-attachment-repository'
import { ChatMessageRepository } from './_repositories/chat-message-repository'
import { ChatReadStateRepository } from './_repositories/chat-read-state-repository'

export const SupportChatEntityModule = new ContainerModule(context => {
  const { bind } = context

  bind(ChatDialogRepository).toSelf()
  bind(ChatAttachmentRepository).toSelf()
  bind(ChatMessageRepository).toSelf()
  bind(ChatReadStateRepository).toSelf()
})

export { ChatDialogRepository } from './_repositories/chat-dialog-repository'
export { ChatAttachmentRepository } from './_repositories/chat-attachment-repository'
export { ChatMessageRepository } from './_repositories/chat-message-repository'
export { ChatReadStateRepository } from './_repositories/chat-read-state-repository'
