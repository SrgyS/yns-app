import { injectable } from 'inversify'
import { TRPCError } from '@trpc/server'
import { privateConfig } from '@/shared/config/private'
import { logger } from '@/shared/lib/logger'
import type { LeadRequestInput } from '../_domain/lead-request-schema'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 1
const TELEGRAM_MESSAGE_LIMIT = 3900

@injectable()
export class LeadRequestRateLimiter {
  private readonly requests = new Map<string, number[]>()

  assertAllowed(key: string) {
    const now = Date.now()
    const existing = this.requests.get(key) ?? []
    const active = existing.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)

    if (active.length >= RATE_LIMIT_MAX_REQUESTS) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Слишком много запросов. Попробуйте позже.',
      })
    }

    active.push(now)
    this.requests.set(key, active)
  }
}

@injectable()
export class LeadRequestService {
  constructor(private readonly rateLimiter: LeadRequestRateLimiter) {}

  async submit(input: LeadRequestInput) {
    if (input.honey) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Некорректные данные формы.',
      })
    }

    const key = `${input.phone}:${input.country}`
    this.rateLimiter.assertAllowed(key)

    const message = this.formatMessage(input)
    await this.sendToTelegram(message)
  }

  private formatMessage(input: LeadRequestInput) {
    const lines = [
      'Новая заявка',
      `ФИО: ${input.fullName}`,
      `Телефон: ${input.phone}`,
      `Страна: ${input.country}`,
      `Telegram: ${input.hasTelegram ? 'Есть' : 'Нет'}`,
    ]

    if (input.hasTelegram && input.telegramContact) {
      lines.push(`Контакт: ${input.telegramContact}`)
    }

    if (input.source) {
      lines.push(`Источник: ${input.source}`)
    }

    const text = lines.join('\n')
    return text.length > TELEGRAM_MESSAGE_LIMIT
      ? text.slice(0, TELEGRAM_MESSAGE_LIMIT)
      : text
  }

  private async sendToTelegram(text: string) {
    const token = privateConfig.TELEGRAM_BOT_TOKEN
    const chatId = privateConfig.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      logger.warn({ msg: 'Telegram config is missing' })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Сервис отправки недоступен.',
      })
    }

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
      msg: 'Failed to send lead request to Telegram',
      status: response.status,
      errorText,
    })

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ошибка при отправке заявки.',
    })
  }
}
