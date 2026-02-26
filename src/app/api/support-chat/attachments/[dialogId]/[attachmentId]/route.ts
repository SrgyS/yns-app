import { getServerSession } from 'next-auth'

import { server } from '@/app/server'
import { ChatAttachmentRepository } from '@/entities/support-chat/module'
import {
  buildAttachmentCacheHeaders,
  isAttachmentNotModified,
} from '@/features/support-chat/_domain/attachment-http-cache'
import {
  assertSupportChatAttachmentRateLimit,
  supportChatAttachmentRateLimitRetryAfterSeconds,
} from '@/features/support-chat/_domain/attachment-rate-limit'
import { Role } from '@/kernel/domain/user'
import { NextAuthConfig } from '@/kernel/lib/next-auth/module'
import { dbClient } from '@/shared/lib/db'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'

type RouteParams = {
  dialogId: string
  attachmentId: string
}

const canAccessStaffSupportChat = async (role: Role, userId: string) => {
  if (role === 'ADMIN') {
    return true
  }

  if (role !== 'STAFF') {
    return false
  }

  const permission = await dbClient.staffPermission.findUnique({
    where: {
      userId,
    },
    select: {
      canManageSupportChats: true,
    },
  })

  return Boolean(permission?.canManageSupportChats)
}

const hasDialogAccess = async (dialogId: string, role: Role, userId: string) => {
  const dialog = await dbClient.chatDialog.findUnique({
    where: {
      id: dialogId,
    },
    select: {
      userId: true,
    },
  })

  if (!dialog) {
    return false
  }

  if (role === 'USER') {
    return dialog.userId === userId
  }

  return await canAccessStaffSupportChat(role, userId)
}

const encodeFileNameHeader = (name: string) => {
  return encodeURIComponent(name)
}

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> }
) {
  const session = await getServerSession(server.get(NextAuthConfig).options)

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // NOTE: Per-user key avoids x-forwarded-for spoofing in non-trusted proxy setups.
  // TODO(redis): Use shared distributed limiter and optionally add trusted client IP
  // in the key (userId+ip) once proxy chain and header trust are formally configured.
  const rateLimitKey = session.user.id
  if (!assertSupportChatAttachmentRateLimit(rateLimitKey)) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(supportChatAttachmentRateLimitRetryAfterSeconds),
      },
    })
  }

  const { dialogId, attachmentId } = await context.params

  const allowed = await hasDialogAccess(dialogId, session.user.role, session.user.id)
  if (!allowed) {
    return new Response('Not Found', { status: 404 })
  }

  const attachmentRepository = server.get(ChatAttachmentRepository)
  const attachment = await attachmentRepository.findByDialogAndId(dialogId, attachmentId)

  if (!attachment) {
    return new Response('Not Found', { status: 404 })
  }

  const cacheSnapshot = {
    etag: attachment.etag,
    lastModified: attachment.lastModified,
  }
  const cacheHeaders = buildAttachmentCacheHeaders(cacheSnapshot)
  if (isAttachmentNotModified(request, cacheSnapshot)) {
    return new Response(null, {
      status: 304,
      headers: {
        'Cache-Control': 'private, max-age=300',
        ...(cacheHeaders.etag ? { ETag: cacheHeaders.etag } : {}),
        ...(cacheHeaders.lastModified
          ? { 'Last-Modified': cacheHeaders.lastModified }
          : {}),
      },
    })
  }

  let file: Awaited<ReturnType<typeof fileStorage.downloadStreamByPath>>
  try {
    file = await fileStorage.downloadStreamByPath(attachment.storagePath)
  } catch {
    return new Response('Not Found', { status: 404 })
  }

  const contentType = attachment.mimeType || file.contentType
  const contentLength = file.contentLength ?? attachment.sizeBytes
  const responseEtag = cacheHeaders.etag ?? (file.eTag ? file.eTag : undefined)
  const responseLastModified =
    cacheHeaders.lastModified ??
    (file.lastModified ? file.lastModified.toUTCString() : undefined)

  return new Response(file.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(contentLength),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeFileNameHeader(attachment.originalName)}`,
      'Cache-Control': 'private, max-age=300',
      ...(responseEtag ? { ETag: responseEtag } : {}),
      ...(responseLastModified ? { 'Last-Modified': responseLastModified } : {}),
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Cookie',
    },
  })
}
