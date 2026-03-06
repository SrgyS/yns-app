import { z } from 'zod'

import {
  assertAttachmentMimeType,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../_domain/attachment-schema'

export type SupportChatAttachmentInput = {
  attachmentId: string
  name: string
  mimeType: string
  sizeBytes: number
}

export type SupportChatPendingAttachmentInput = SupportChatAttachmentInput & {
  previewUrl?: string
}

type UploadSupportChatAttachmentsInput = {
  files: File[]
  dialogId?: string
  newDialog?: boolean
  signal?: AbortSignal
}

const SUPPORT_CHAT_ATTACHMENT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  '.mov',
  'application/pdf',
  'text/plain',
].join(',')

const uploadResponseSchema = z.object({
  attachment: z.object({
    attachmentId: z.string().min(1),
    dialogId: z.string().min(1),
    name: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
  }),
})

const isPreviewableAttachment = (file: File) => {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

const mapUploadStatusToErrorCode = (status: number): string => {
  if (status === 401) {
    return 'UNAUTHORIZED'
  }

  if (status === 403) {
    return 'FORBIDDEN'
  }

  if (status === 408) {
    return 'REQUEST_TIMEOUT'
  }

  if (status === 413) {
    return 'ATTACHMENT_TOO_LARGE'
  }

  if (status === 415) {
    return 'ATTACHMENT_UNSUPPORTED_TYPE'
  }

  if (status >= 400 && status < 500) {
    return 'BAD_REQUEST'
  }

  return 'INTERNAL_SERVER_ERROR'
}

const validateAttachmentFile = (file: File) => {
  if (file.size <= 0) {
    throw new Error('BAD_REQUEST')
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error('ATTACHMENT_TOO_LARGE')
  }

  try {
    assertAttachmentMimeType(file.type)
  } catch {
    throw new Error('ATTACHMENT_UNSUPPORTED_TYPE')
  }
}

const uploadSingleAttachment = async (input: {
  file: File
  dialogId?: string
  newDialog?: boolean
  signal?: AbortSignal
}): Promise<SupportChatAttachmentInput> => {
  const formData = new FormData()
  formData.append('file', input.file)
  if (input.dialogId) {
    formData.append('dialogId', input.dialogId)
  }
  if (input.newDialog) {
    formData.append('newDialog', 'true')
  }

  const response = await fetch('/api/support-chat/uploads', {
    method: 'POST',
    body: formData,
    signal: input.signal,
  })

  if (!response.ok) {
    throw new Error(mapUploadStatusToErrorCode(response.status))
  }

  const payload = uploadResponseSchema.safeParse(await response.json())
  if (!payload.success) {
    throw new Error('INTERNAL_SERVER_ERROR')
  }

  return payload.data.attachment
}

export async function toSupportChatAttachments({
  files,
  dialogId,
  newDialog,
  signal,
}: UploadSupportChatAttachmentsInput): Promise<SupportChatAttachmentInput[] | undefined> {
  if (files.length === 0) {
    return undefined
  }

  files.forEach(validateAttachmentFile)
  const uploadedAttachments = await Promise.all(
    files.map(file =>
      uploadSingleAttachment({
        file,
        dialogId,
        newDialog,
        signal,
      })
    )
  )

  return uploadedAttachments
}

export const toPendingSupportChatAttachments = (
  files: File[],
  uploadedAttachments: SupportChatAttachmentInput[]
): SupportChatPendingAttachmentInput[] => {
  return uploadedAttachments.map((attachment, index) => {
    const file = files[index]
    const previewUrl = file && isPreviewableAttachment(file)
      ? URL.createObjectURL(file)
      : undefined

    if (previewUrl) {
      return {
        ...attachment,
        previewUrl,
      }
    }

    return attachment
  })
}

export const revokePendingSupportChatAttachmentPreviews = (
  attachments: SupportChatPendingAttachmentInput[] | undefined
) => {
  if (!attachments) {
    return
  }

  attachments.forEach(attachment => {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
  })
}

export { SUPPORT_CHAT_ATTACHMENT_ACCEPT }
