import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { SupportChatController } from './_controller'
import { SupportChatService } from './_services/support-chat-service'
import { SupportChatReadService } from './_services/support-chat-read-service'
import { TelegramSupportNotifier } from './_integrations/telegram-support-notifier'

export const SupportChatModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(SupportChatController)
  bind(SupportChatService).toSelf()
  bind(SupportChatReadService).toSelf()
  bind(TelegramSupportNotifier).toSelf()
})

export { SupportChatController } from './_controller'
export { SupportChatService } from './_services/support-chat-service'
export { SupportChatReadService } from './_services/support-chat-read-service'
export { TelegramSupportNotifier } from './_integrations/telegram-support-notifier'
