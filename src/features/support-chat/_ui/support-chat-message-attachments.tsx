'use client'

import Image from 'next/image'
import { FileText, Paperclip } from 'lucide-react'

import {
  parseStoredSupportChatAttachments,
  type StoredSupportChatAttachment,
} from '../_domain/attachment-schema'

type SupportChatMessageAttachmentsProps = {
  dialogId: string
  attachments: unknown
}

const buildAttachmentUrl = (dialogId: string, attachmentId: string) => {
  return `/api/support-chat/attachments/${dialogId}/${attachmentId}`
}

const isImageAttachment = (attachment: StoredSupportChatAttachment) => {
  return attachment.type.startsWith('image/')
}

const isVideoAttachment = (attachment: StoredSupportChatAttachment) => {
  return attachment.type.startsWith('video/')
}

const isPdfAttachment = (attachment: StoredSupportChatAttachment) => {
  return attachment.type === 'application/pdf'
}

const formatAttachmentSize = (sizeBytes: number) => {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`
  }

  return `${sizeBytes} B`
}

const renderAttachmentPreview = (
  dialogId: string,
  attachment: StoredSupportChatAttachment
) => {
  const attachmentUrl = buildAttachmentUrl(dialogId, attachment.id)

  if (isImageAttachment(attachment)) {
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-md border bg-background"
      >
        <Image
          src={attachmentUrl}
          alt={attachment.name}
          width={480}
          height={320}
          className="h-36 w-full object-cover"
          loading="lazy"
          unoptimized
        />
      </a>
    )
  }

  if (isVideoAttachment(attachment)) {
    return (
      <video controls preload="metadata" className="w-full rounded-md border bg-background">
        <source src={attachmentUrl} type={attachment.type} />
      </video>
    )
  }

  if (isPdfAttachment(attachment)) {
    return (
      <iframe
        src={attachmentUrl}
        title={attachment.name}
        className="h-40 w-full rounded-md border bg-background"
      />
    )
  }

  return (
    <a
      href={attachmentUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
    >
      <FileText className="h-4 w-4" />
      <span className="truncate text-xs">Открыть файл</span>
    </a>
  )
}

export function SupportChatMessageAttachments({
  dialogId,
  attachments,
}: Readonly<SupportChatMessageAttachmentsProps>) {
  const items = parseStoredSupportChatAttachments(attachments)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="mt-2 space-y-2">
      {items.map(attachment => {
        const attachmentUrl = buildAttachmentUrl(dialogId, attachment.id)

        return (
          <div key={attachment.id} className="space-y-1 text-xs opacity-90">
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="max-w-[220px] truncate underline underline-offset-2"
              >
                {attachment.name}
              </a>
              <span className="text-[10px] opacity-70">
                {formatAttachmentSize(attachment.sizeBytes)}
              </span>
            </div>
            {renderAttachmentPreview(dialogId, attachment)}
          </div>
        )
      })}
    </div>
  )
}
