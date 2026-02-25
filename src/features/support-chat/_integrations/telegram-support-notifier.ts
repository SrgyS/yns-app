import { injectable } from 'inversify'

import { privateConfig } from '@/shared/config/private'
import { logger } from '@/shared/lib/logger'

type NotifyNewUserMessageInput = {
  dialogId: string
  userId: string
  messageText: string | null
  attachmentCount: number
}

@injectable()
export class TelegramSupportNotifier {
  async notifyNewUserMessage(input: NotifyNewUserMessageInput): Promise<void> {
    const token = privateConfig.TELEGRAM_BOT_TOKEN
    const chatId = privateConfig.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      logger.warn({
        msg: 'Support chat telegram config is missing',
      })
      return
    }

    const text = this.formatMessage(input)

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    )

    if (response.ok) {
      return
    }

    const errorText = await response.text().catch(() => '')
    logger.error({
      msg: 'Failed to send support chat message to Telegram',
      status: response.status,
      errorText,
      dialogId: input.dialogId,
      userId: input.userId,
    })
  }

  private formatMessage(input: NotifyNewUserMessageInput): string {
    const lines = [
      'Новое сообщение в support-чате',
      `Dialog ID: ${input.dialogId}`,
      `User ID: ${input.userId}`,
      `Текст: ${input.messageText ?? '—'}`,
      `Вложений: ${input.attachmentCount}`,
    ]

    return lines.join('\n').slice(0, 3900)
  }
}
