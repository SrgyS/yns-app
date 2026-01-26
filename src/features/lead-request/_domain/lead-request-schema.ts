import { z } from 'zod'

export const leadRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Укажите ФИО')
      .max(120, 'Слишком длинное имя'),
    phone: z
      .string()
      .trim()
      .min(6, 'Укажите номер телефона')
      .max(32, 'Слишком длинный номер'),
    country: z
      .string()
      .trim()
      .min(2, 'Укажите страну проживания')
      .max(80, 'Слишком длинное значение'),
    hasTelegram: z.boolean(),
    telegramContact: z
      .string()
      .trim()
      .max(80, 'Слишком длинное значение')
      .optional(),
    source: z.string().trim().max(80).optional(),
    honey: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasTelegram) {
      const contact = data.telegramContact?.trim()

      if (!contact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите, как вас найти в Telegram',
          path: ['telegramContact'],
        })
      }
    }
  })

export type LeadRequestInput = z.infer<typeof leadRequestSchema>
