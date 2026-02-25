import { z } from 'zod'

const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
])

export const supportChatAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_SIZE_BYTES),
  base64: z.string().min(1),
})

export const assertAttachmentMimeType = (mimeType: string) => {
  if (ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType)) {
    return
  }

  throw new Error('Unsupported attachment mime type')
}

export { MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_ATTACHMENT_MIME_TYPES }
