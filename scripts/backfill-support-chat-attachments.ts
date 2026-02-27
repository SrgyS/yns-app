import 'dotenv/config'

import { ChatAttachmentStatus, Prisma } from '@prisma/client'

import { parseStoredSupportChatAttachments } from '@/features/support-chat/_domain/attachment-schema'
import { dbClient } from '@/shared/lib/db'

const DEFAULT_BATCH_SIZE = 200
const DEFAULT_LOCK_KEY = 'support-chat-attachments-backfill-v1'

const isDryRun = process.argv.includes('--dry-run')
const batchSize = Number(
  process.env.SUPPORT_CHAT_ATTACHMENT_BACKFILL_BATCH_SIZE ?? DEFAULT_BATCH_SIZE
)
const lockKey =
  process.env.SUPPORT_CHAT_ATTACHMENT_BACKFILL_LOCK_KEY ?? DEFAULT_LOCK_KEY

const assertPositiveInt = (value: number, name: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
}

const acquireBackfillLock = async (key: string): Promise<boolean> => {
  const rows = await dbClient.$queryRaw<{ acquired: boolean }[]>`
    SELECT pg_try_advisory_lock(hashtext(${key})) AS acquired
  `

  return Boolean(rows[0]?.acquired)
}

const releaseBackfillLock = async (key: string): Promise<void> => {
  await dbClient.$queryRaw`
    SELECT pg_advisory_unlock(hashtext(${key}))
  `
}

const resolveCreatedByUserId = (message: {
  senderUserId: string | null
  senderStaffId: string | null
  dialog: { userId: string }
}): string => {
  if (message.senderUserId) {
    return message.senderUserId
  }

  if (message.senderStaffId) {
    return message.senderStaffId
  }

  return message.dialog.userId
}

async function main() {
  assertPositiveInt(
    batchSize,
    'SUPPORT_CHAT_ATTACHMENT_BACKFILL_BATCH_SIZE'
  )

  const lockAcquired = await acquireBackfillLock(lockKey)
  if (!lockAcquired) {
    console.info(
      `[support-chat-backfill] Lock is already held for key="${lockKey}", skip run`
    )
    return
  }

  console.info(
    `[support-chat-backfill] started dryRun=${isDryRun} batchSize=${batchSize}`
  )

  let cursor: string | undefined
  let selectedMessages = 0
  let selectedAttachments = 0
  let createdAttachments = 0
  let skippedAttachments = 0

  try {
    while (true) {
      const messages = await dbClient.chatMessage.findMany({
        where: {
          attachments: {
            not: Prisma.JsonNull,
          },
        },
        select: {
          id: true,
          dialogId: true,
          senderUserId: true,
          senderStaffId: true,
          attachments: true,
          createdAt: true,
          dialog: {
            select: {
              userId: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
        take: batchSize,
        ...(cursor
          ? {
              skip: 1,
              cursor: {
                id: cursor,
              },
            }
          : {}),
      })

      if (messages.length === 0) {
        break
      }

      selectedMessages += messages.length

      for (const message of messages) {
        const attachments = parseStoredSupportChatAttachments(message.attachments)
        if (attachments.length === 0) {
          continue
        }

        for (const attachment of attachments) {
          selectedAttachments += 1

          const existingByMessageAndPath = await dbClient.chatAttachment.findFirst({
            where: {
              messageId: message.id,
              storagePath: attachment.path,
            },
            select: {
              id: true,
            },
          })

          if (existingByMessageAndPath) {
            skippedAttachments += 1
            continue
          }

          if (isDryRun) {
            createdAttachments += 1
            console.info(
              `[support-chat-backfill][dry-run] would create attachment id=${attachment.id} messageId=${message.id} path=${attachment.path}`
            )
            continue
          }

          const createdByUserId = resolveCreatedByUserId(message)

          await dbClient.chatAttachment.create({
            data: {
              dialogId: message.dialogId,
              messageId: message.id,
              storagePath: attachment.path,
              mimeType: attachment.type,
              sizeBytes: attachment.sizeBytes,
              originalName: attachment.name,
              createdByUserId,
              status: ChatAttachmentStatus.LINKED,
              createdAt: message.createdAt,
            },
          })
          createdAttachments += 1
        }
      }

      cursor = messages[messages.length - 1]?.id
    }
  } finally {
    await releaseBackfillLock(lockKey)
  }

  console.info(
    `[support-chat-backfill] done messages=${selectedMessages} attachments=${selectedAttachments} created=${createdAttachments} skipped=${skippedAttachments} dryRun=${isDryRun}`
  )
}

main()
  .catch(error => {
    console.error('[support-chat-backfill][fatal]', error)
    process.exit(1)
  })
  .finally(async () => {
    await dbClient.$disconnect()
  })
