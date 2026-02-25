import { ContainerModule } from 'inversify'

import { SupportConversationRepository } from './_repositories/support-conversation-repository'
import { SupportMessageRepository } from './_repositories/support-message-repository'
import { SupportReadStateRepository } from './_repositories/support-read-state-repository'

export const SupportChatEntityModule = new ContainerModule(context => {
  const { bind } = context

  bind(SupportConversationRepository).toSelf()
  bind(SupportMessageRepository).toSelf()
  bind(SupportReadStateRepository).toSelf()
})

export { SupportConversationRepository } from './_repositories/support-conversation-repository'
export { SupportMessageRepository } from './_repositories/support-message-repository'
export { SupportReadStateRepository } from './_repositories/support-read-state-repository'