import { getServerSession } from 'next-auth'

import { server } from '@/app/server'
import {
  ChatAttachmentRepository,
  ChatDialogRepository,
} from '@/entities/support-chat/module'
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  assertAttachmentMimeType,
} from '@/features/support-chat/_domain/attachment-schema'
import { Role } from '@/kernel/domain/user'
import { NextAuthConfig } from '@/kernel/lib/next-auth/module'
import { dbClient } from '@/shared/lib/db'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { sanitizeFileName } from '@/shared/lib/file-storage/utils'
import { logger } from '@/shared/lib/logger'
import { publicConfig } from '@/shared/config/public'
import { isTrustedRequestOrigin } from '@/shared/lib/security/trusted-origin'

const SUPPORT_CHAT_UPLOAD_REQUEST_TIMEOUT_MS = 60_000
const SUPPORT_CHAT_UPLOAD_NO_PROGRESS_TIMEOUT_MS = 20_000

const isTrustedUploadsRequestOrigin = (request: Request) => {
  return isTrustedRequestOrigin({
    requestUrl: request.url,
    originHeader: request.headers.get('origin'),
    refererHeader: request.headers.get('referer'),
    hostHeader: request.headers.get('host'),
    forwardedHostHeader: request.headers.get('x-forwarded-host'),
    forwardedProtoHeader: request.headers.get('x-forwarded-proto'),
    publicAppUrl: publicConfig.PUBLIC_URL,
  })
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

const resolveUploadDialogId = async (input: {
  dialogId: string | undefined
  newDialog: boolean
  role: Role
  userId: string
}) => {
  const dialogRepository = server.get(ChatDialogRepository)

  if (input.dialogId) {
    const dialog = await dbClient.chatDialog.findUnique({
      where: {
        id: input.dialogId,
      },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!dialog) {
      return null
    }

    if (input.role === 'USER') {
      if (dialog.userId !== input.userId) {
        return null
      }

      return dialog.id
    }

    const hasAccess = await canAccessStaffSupportChat(input.role, input.userId)
    if (!hasAccess) {
      return null
    }

    return dialog.id
  }

  if (!input.newDialog) {
    return null
  }

  if (input.role !== 'USER') {
    return null
  }

  const canonical = await dialogRepository.createOrReturnCanonical({
    userId: input.userId,
    lastMessageAt: new Date(),
  })

  return canonical.dialog.id
}

export async function POST(request: Request) {
  const session = await getServerSession(server.get(NextAuthConfig).options)
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!isTrustedUploadsRequestOrigin(request)) {
    return new Response('Forbidden', { status: 403 })
  }

  const uploadAbortController = new AbortController()
  let abortReason: 'hard-timeout' | 'no-progress-timeout' | 'client-disconnect' | null =
    null

  const abortUpload = (reason: 'hard-timeout' | 'no-progress-timeout' | 'client-disconnect') => {
    if (uploadAbortController.signal.aborted) {
      return
    }

    abortReason = reason
    uploadAbortController.abort()
  }

  const requestAbortHandler = () => {
    abortUpload('client-disconnect')
  }
  request.signal.addEventListener('abort', requestAbortHandler)

  const requestTimeout = setTimeout(() => {
    abortUpload('hard-timeout')
  }, SUPPORT_CHAT_UPLOAD_REQUEST_TIMEOUT_MS)

  let noProgressTimeout: ReturnType<typeof setTimeout> | null = null
  const scheduleNoProgressTimeout = () => {
    if (noProgressTimeout) {
      clearTimeout(noProgressTimeout)
    }

    noProgressTimeout = setTimeout(() => {
      abortUpload('no-progress-timeout')
    }, SUPPORT_CHAT_UPLOAD_NO_PROGRESS_TIMEOUT_MS)
  }

  let resolvedDialogIdForLog: string | null = null
  let fileTypeForLog = 'unknown'
  let fileSizeForLog = -1

  try {
    if (uploadAbortController.signal.aborted) {
      throw new Error('Upload aborted')
    }

    const formData = await request.formData()
    if (uploadAbortController.signal.aborted) {
      throw new Error('Upload aborted')
    }

    const fileEntry = formData.get('file')
    if (!(fileEntry instanceof File)) {
      return new Response('File is required', { status: 400 })
    }
    fileTypeForLog = fileEntry.type
    fileSizeForLog = fileEntry.size

    if (fileEntry.size <= 0) {
      return new Response('File is empty', { status: 400 })
    }

    if (fileEntry.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return new Response('File exceeds max size', { status: 413 })
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(fileEntry.type)) {
      return new Response('Unsupported attachment mime type', { status: 415 })
    }

    try {
      assertAttachmentMimeType(fileEntry.type)
    } catch {
      return new Response('Unsupported attachment mime type', { status: 415 })
    }

    const rawDialogId = formData.get('dialogId')
    const dialogId =
      typeof rawDialogId === 'string' && rawDialogId.trim().length > 0
        ? rawDialogId.trim()
        : undefined
    const rawNewDialog = formData.get('newDialog')
    const isNewDialogUpload =
      typeof rawNewDialog === 'string' && rawNewDialog === 'true'

    const resolvedDialogId = await resolveUploadDialogId({
      dialogId,
      newDialog: isNewDialogUpload,
      role: session.user.role,
      userId: session.user.id,
    })
    if (!resolvedDialogId) {
      return new Response('Dialog is required or access denied', { status: 403 })
    }
    resolvedDialogIdForLog = resolvedDialogId

    const safeFileName = sanitizeFileName(fileEntry.name)
    const uploadFile =
      safeFileName === fileEntry.name
        ? fileEntry
        : new File([fileEntry], safeFileName, { type: fileEntry.type })

    scheduleNoProgressTimeout()

    const stored = await fileStorage.uploadFile(
      uploadFile,
      'support-chat',
      session.user.id,
      'private',
      {
        signal: uploadAbortController.signal,
        onProgress: scheduleNoProgressTimeout,
      }
    )

    const attachmentRepository = server.get(ChatAttachmentRepository)
    const created = await attachmentRepository.createUploaded({
      dialogId: resolvedDialogId,
      storagePath: stored.path,
      mimeType: uploadFile.type,
      sizeBytes: uploadFile.size,
      originalName: uploadFile.name,
      createdByUserId: session.user.id,
      etag: stored.eTag ?? null,
      lastModified: null,
    })

    return Response.json({
      attachment: {
        attachmentId: created.id,
        dialogId: created.dialogId,
        name: created.originalName,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
      },
    })
  } catch (error) {
    logger.warn({
      msg: 'Support chat upload failed',
      userId: session.user.id,
      dialogId: resolvedDialogIdForLog,
      fileType: fileTypeForLog,
      fileSizeBytes: fileSizeForLog,
      allowedTypes: Array.from(ALLOWED_ATTACHMENT_MIME_TYPES),
      abortReason,
      error,
    })

    if (abortReason === 'client-disconnect') {
      return new Response('Upload aborted by client', { status: 499 })
    }

    if (abortReason === 'hard-timeout' || abortReason === 'no-progress-timeout') {
      return new Response('Upload timeout', { status: 408 })
    }

    return new Response('Upload failed', { status: 500 })
  } finally {
    request.signal.removeEventListener('abort', requestAbortHandler)
    clearTimeout(requestTimeout)
    if (noProgressTimeout) {
      clearTimeout(noProgressTimeout)
    }
  }
}
