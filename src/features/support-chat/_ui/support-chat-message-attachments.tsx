'use client'

import Image from 'next/image'
import { FileText } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import {
  parseStoredSupportChatAttachments,
  type StoredSupportChatAttachment,
} from '../_domain/attachment-schema'
import { Skeleton } from '@/shared/ui/skeleton'

type SupportChatMessageAttachmentsProps = {
  dialogId: string
  attachments: unknown
  isOutgoing: boolean
}

const ATTACHMENT_PREVIEW_WIDTH_CLASS =
  'w-[min(22rem,calc(100vw-7rem))] max-w-full'

const MAX_PREVIEW_VIEWPORT_HEIGHT_CLASS = 'max-h-[60vh]'

const buildAttachmentUrl = (
  dialogId: string,
  attachmentId: string,
  attachmentPath: string
) => {
  if (attachmentPath.startsWith('data:')) {
    return attachmentPath
  }

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

function SupportChatFileCard({
  attachmentUrl,
  attachment,
  sizeLabel,
  label,
  surfaceClassName,
}: Readonly<{
  attachmentUrl: string
  attachment: StoredSupportChatAttachment
  sizeLabel: string
  label: string
  surfaceClassName: string
}>) {
  return (
    <a
      href={attachmentUrl}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2 ${surfaceClassName} ${ATTACHMENT_PREVIEW_WIDTH_CLASS}`}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{attachment.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {label} • {sizeLabel}
        </div>
      </div>
    </a>
  )
}

function SupportChatImagesGrid({
  dialogId,
  images,
  surfaceClassName,
}: Readonly<{
  dialogId: string
  images: StoredSupportChatAttachment[]
  surfaceClassName: string
}>) {
  const visibleImages = images.slice(0, 4)
  const isOddVisibleCount = visibleImages.length % 2 === 1

  return (
    <div
      className={`grid grid-cols-2 gap-1 overflow-hidden rounded-2xl ${surfaceClassName} ${ATTACHMENT_PREVIEW_WIDTH_CLASS}`}
    >
      {visibleImages.map((img, idx) => {
        const url = buildAttachmentUrl(dialogId, img.id, img.path)
        const tileSpanClass = isOddVisibleCount && idx === 0 ? 'col-span-2' : ''
        const aspectClassName =
          isOddVisibleCount && idx === 0 ? 'aspect-[2/1]' : 'aspect-square'

        return (
          <a
            key={img.id}
            href={url}
            target="_blank"
            rel="noreferrer"
            className={`relative overflow-hidden ${surfaceClassName} ${tileSpanClass}`}
            aria-label={`Открыть ${img.name}`}
          >
            <div className={`relative w-full ${aspectClassName}`}>
              <Image
                src={url}
                alt={img.name}
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 768px) 50vw, 22rem"
              />
            </div>
          </a>
        )
      })}
    </div>
  )
}

function SupportChatAttachmentPreview({
  dialogId,
  attachment,
  surfaceClassName,
}: Readonly<{
  dialogId: string
  attachment: StoredSupportChatAttachment
  surfaceClassName: string
}>) {
  const attachmentUrl = buildAttachmentUrl(
    dialogId,
    attachment.id,
    attachment.path
  )
  const sizeLabel = formatAttachmentSize(attachment.sizeBytes)
  const sizeBadgeClassName =
    'absolute right-2 top-2 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-white'
  const [isLoadingPreview, setIsLoadingPreview] = useState(
    isImageAttachment(attachment) || isVideoAttachment(attachment)
  )

  if (isImageAttachment(attachment)) {
    return (
      <a
        href={attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className={`relative block overflow-hidden rounded-2xl ${surfaceClassName} ${ATTACHMENT_PREVIEW_WIDTH_CLASS} ${MAX_PREVIEW_VIEWPORT_HEIGHT_CLASS}`}
        aria-label={`Открыть ${attachment.name}`}
      >
        {isLoadingPreview ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        ) : null}

        <Image
          src={attachmentUrl}
          alt={attachment.name}
          width={480}
          height={320}
          className={`block h-auto w-full ${MAX_PREVIEW_VIEWPORT_HEIGHT_CLASS} object-contain ${
            isLoadingPreview ? 'opacity-0' : 'opacity-100'
          }`}
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
      <div
        className={`relative overflow-hidden rounded-2xl ${surfaceClassName} ${ATTACHMENT_PREVIEW_WIDTH_CLASS}`}
      >
        {isLoadingPreview ? (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        ) : null}
        <video
          controls
          preload="metadata"
          className={`w-full rounded-2xl border border-border/60 object-cover ${MAX_PREVIEW_VIEWPORT_HEIGHT_CLASS} ${
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
    // Telegram-like: show as a document card (no inline iframe preview)
    return (
      <SupportChatFileCard
        attachmentUrl={attachmentUrl}
        attachment={attachment}
        sizeLabel={sizeLabel}
        label="PDF"
        surfaceClassName={surfaceClassName}
      />
    )
  }

  if (isTextAttachment(attachment)) {
    return (
      <SupportChatFileCard
        attachmentUrl={attachmentUrl}
        attachment={attachment}
        sizeLabel={sizeLabel}
        label="Текстовый документ"
        surfaceClassName={surfaceClassName}
      />
    )
  }

  return (
    <SupportChatFileCard
      attachmentUrl={attachmentUrl}
      attachment={attachment}
      sizeLabel={sizeLabel}
      label="Файл"
      surfaceClassName={surfaceClassName}
    />
  )
}

export function SupportChatMessageAttachments({
  dialogId,
  attachments,
  isOutgoing,
}: Readonly<SupportChatMessageAttachmentsProps>) {
  const items = parseStoredSupportChatAttachments(attachments)
  const surfaceClassName = isOutgoing ? 'bg-primary/10' : 'bg-muted'

  const { images, other } = useMemo(() => {
    const imgs: StoredSupportChatAttachment[] = []
    const rest: StoredSupportChatAttachment[] = []

    for (const a of items) {
      if (isImageAttachment(a)) {
        imgs.push(a)
      } else {
        rest.push(a)
      }
    }

    return { images: imgs, other: rest }
  }, [items])

  if (items.length === 0) {
    return null
  }

  let imagesSection: ReactNode = null
  if (images.length > 0) {
    if (images.length === 1) {
      imagesSection = (
        <SupportChatAttachmentPreview
          dialogId={dialogId}
          attachment={images[0]}
          surfaceClassName={surfaceClassName}
        />
      )
    } else {
      imagesSection = (
        <SupportChatImagesGrid
          dialogId={dialogId}
          images={images}
          surfaceClassName={surfaceClassName}
        />
      )
    }
  }

  return (
    <div
      className={`mb-2 space-y-2 self-end rounded-2xl border p-0.5 ${surfaceClassName}`}
    >
      {imagesSection}

      {other.map(att => (
        <SupportChatAttachmentPreview
          key={att.id}
          dialogId={dialogId}
          attachment={att}
          surfaceClassName={surfaceClassName}
        />
      ))}
    </div>
  )
}
