'use client'

import Image from 'next/image'
import { FileText } from 'lucide-react'
import { useState } from 'react'

import {
  parseStoredSupportChatAttachments,
  type StoredSupportChatAttachment,
} from '../_domain/attachment-schema'
import { Skeleton } from '@/shared/ui/skeleton'

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

const isTextAttachment = (attachment: StoredSupportChatAttachment) => {
  return (
    attachment.type.startsWith('text/') ||
    attachment.type === 'application/json' ||
    attachment.type === 'application/xml'
  )
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

function SupportChatAttachmentPreview({
  dialogId,
  attachment,
}: Readonly<{
  dialogId: string
  attachment: StoredSupportChatAttachment
}>) {
  const attachmentUrl = buildAttachmentUrl(dialogId, attachment.id)
  const sizeLabel = formatAttachmentSize(attachment.sizeBytes)
  const sizeBadgeClassName =
    'absolute right-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white'
  const [isLoadingPreview, setIsLoadingPreview] = useState(
    isImageAttachment(attachment) ||
    isVideoAttachment(attachment) ||
    isPdfAttachment(attachment)
  )

  if (isImageAttachment(attachment)) {
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="relative block h-36 overflow-hidden"
      >
        {isLoadingPreview ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        ) : null}
        <Image
          src={attachmentUrl}
          alt={attachment.name}
          width={480}
          height={320}
          className={`h-36 w-full object-cover ${isLoadingPreview ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          unoptimized
          onLoad={() => setIsLoadingPreview(false)}
          onError={() => setIsLoadingPreview(false)}
        />
        <span className={sizeBadgeClassName}>{sizeLabel}</span>
      </a>
    )
  }

  if (isVideoAttachment(attachment)) {
    return (
      <div className="relative">
        {isLoadingPreview ? (
          <Skeleton className="absolute inset-0 h-40 w-full rounded-md" />
        ) : null}
        <video
          controls
          preload="metadata"
          className={`h-40 w-full rounded-md border border-border/60 object-cover ${
            isLoadingPreview ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadedData={() => setIsLoadingPreview(false)}
          onError={() => setIsLoadingPreview(false)}
        >
          <source src={attachmentUrl} type={attachment.type} />
        </video>
        <span className={sizeBadgeClassName}>{sizeLabel}</span>
      </div>
    )
  }

  if (isPdfAttachment(attachment)) {
    return (
      <div className="relative">
        {isLoadingPreview ? (
          <Skeleton className="absolute inset-0 h-40 w-full rounded-md" />
        ) : null}
        <iframe
          src={attachmentUrl}
          title={attachment.name}
          className={`h-40 w-full rounded-md border border-border/60 ${
            isLoadingPreview ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoadingPreview(false)}
        />
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0"
          aria-label={`Открыть ${attachment.name}`}
        />
        <span className={sizeBadgeClassName}>{sizeLabel}</span>
      </div>
    )
  }

  if (isTextAttachment(attachment)) {
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="relative flex min-h-16 items-center rounded-md border border-border/60 px-3 py-2"
      >
        <FileText className="h-4 w-4" />
        <span className="ml-2 truncate text-xs">Текстовый документ</span>
        <span className={sizeBadgeClassName}>{sizeLabel}</span>
      </a>
    )
  }

  return (
    <a
      href={attachmentUrl}
      target="_blank"
      rel="noreferrer"
      className="relative flex items-center gap-2 rounded-md border border-border/60 px-3 py-2"
    >
      <FileText className="h-4 w-4" />
      <span className="truncate text-xs">Файл</span>
      <span className={sizeBadgeClassName}>{sizeLabel}</span>
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
    <div className="mb-2 space-y-2">
      {items.map(attachment => {
        return (
              <div
                key={attachment.id}
                className="space-y-2 rounded-md border-2 border-primary text-xs overflow-hidden"
              >
                <SupportChatAttachmentPreview
                  dialogId={dialogId}
                  attachment={attachment}
                />
              </div>
            )
          })}
    </div>
  )
}
