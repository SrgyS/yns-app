import { z } from 'zod'
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  supportChatAttachmentSchema,
} from './attachment-schema'

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const userListDialogsInputSchema = paginationSchema

export const userGetMessagesInputSchema = paginationSchema.extend({
  dialogId: z.string().min(1),
})

export const staffListDialogsInputSchema = paginationSchema.extend({
  hasUnansweredIncoming: z.boolean().optional(),
})

export const staffOpenDialogForUserInputSchema = z.object({
  userId: z.string().min(1),
})

export const sendMessageInputSchema = z
  .object({
    dialogId: z.string().min(1),
    clientMessageId: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    text: z.string().trim().max(4000).optional(),
    attachments: z
      .array(supportChatAttachmentSchema)
      .max(MAX_ATTACHMENTS_PER_MESSAGE)
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasText = Boolean(value.text && value.text.length > 0)
    const hasAttachments = Boolean(value.attachments && value.attachments.length > 0)

    if (hasText || hasAttachments) {
      return
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Message text or attachments are required',
      path: ['text'],
    })
  })

export const markDialogReadInputSchema = z.object({
  dialogId: z.string().min(1),
  lastReadMessageId: z.string().min(1),
})

export const editMessageInputSchema = z.object({
  dialogId: z.string().min(1),
  messageId: z.string().min(1),
  text: z.string().trim().min(1).max(4000),
})

export const deleteMessageInputSchema = z.object({
  dialogId: z.string().min(1),
  messageId: z.string().min(1),
})

export const createDialogInputSchema = z
  .object({
    topic: z.string().trim().max(200).optional(),
    initialMessage: z.string().trim().max(4000),
    attachments: z
      .array(supportChatAttachmentSchema)
      .max(MAX_ATTACHMENTS_PER_MESSAGE)
      .optional(),
  })
  .superRefine((value, ctx) => {
    const hasText = value.initialMessage.length > 0
    const hasAttachments = Boolean(value.attachments && value.attachments.length > 0)

    if (hasText || hasAttachments) {
      return
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Initial message or attachments are required',
      path: ['initialMessage'],
    })
  })
