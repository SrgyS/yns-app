import 'dotenv/config'

import { ChatAttachmentRepository } from '@/entities/support-chat/module'
import { dbClient } from '@/shared/lib/db'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'

const DEFAULT_STALE_MINUTES = 60
const DEFAULT_BATCH_SIZE = 100
const DEFAULT_LOCK_KEY = 'support-chat-attachments-cleanup-v1'

const isDryRun = process.argv.includes('--dry-run')

const staleMinutes = Number(
  process.env.SUPPORT_CHAT_ATTACHMENT_CLEANUP_STALE_MINUTES ??
    DEFAULT_STALE_MINUTES
)
const batchSize = Number(
  process.env.SUPPORT_CHAT_ATTACHMENT_CLEANUP_BATCH_SIZE ?? DEFAULT_BATCH_SIZE
)
const lockKey =
  process.env.SUPPORT_CHAT_ATTACHMENT_CLEANUP_LOCK_KEY ?? DEFAULT_LOCK_KEY

const assertPositiveInt = (value: number, name: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
}

const acquireCleanupLock = async (key: string): Promise<boolean> => {
  const rows = await dbClient.$queryRaw<{ acquired: boolean }[]>`
    SELECT pg_try_advisory_lock(hashtext(${key})) AS acquired
  `

  return Boolean(rows[0]?.acquired)
}

const releaseCleanupLock = async (key: string): Promise<void> => {
  await dbClient.$queryRaw`
    SELECT pg_advisory_unlock(hashtext(${key}))
  `
}

async function main() {
  assertPositiveInt(staleMinutes, 'SUPPORT_CHAT_ATTACHMENT_CLEANUP_STALE_MINUTES')
  assertPositiveInt(batchSize, 'SUPPORT_CHAT_ATTACHMENT_CLEANUP_BATCH_SIZE')

  const lockAcquired = await acquireCleanupLock(lockKey)
  if (!lockAcquired) {
    console.info(
      `[support-chat-cleanup] Lock is already held for key="${lockKey}", skip run`
    )
    return
  }

  console.info(
    `[support-chat-cleanup] started dryRun=${isDryRun} staleMinutes=${staleMinutes} batchSize=${batchSize}`
  )

  const attachmentRepository = new ChatAttachmentRepository()
  const olderThan = new Date(Date.now() - staleMinutes * 60_000)

  let totalSelected = 0
  let totalDeletedStorage = 0
  let totalDeletedRows = 0
  let totalStorageErrors = 0

  try {
    while (true) {
      const staleAttachments = await attachmentRepository.listStaleUploaded(
        olderThan,
        batchSize
      )
      if (staleAttachments.length === 0) {
        break
      }

      totalSelected += staleAttachments.length
      const idsToDeleteFromDb: string[] = []

      for (const attachment of staleAttachments) {
        if (isDryRun) {
          console.info(
            `[support-chat-cleanup][dry-run] would delete id=${attachment.id} path=${attachment.storagePath}`
          )
          idsToDeleteFromDb.push(attachment.id)
          continue
        }

        try {
          await fileStorage.deleteByPath(attachment.storagePath)
          idsToDeleteFromDb.push(attachment.id)
          totalDeletedStorage += 1
        } catch (error) {
          totalStorageErrors += 1
          console.warn(
            `[support-chat-cleanup] storage delete failed id=${attachment.id} path=${attachment.storagePath}`,
            error
          )
        }
      }

      if (idsToDeleteFromDb.length === 0) {
        continue
      }

      if (isDryRun) {
        totalDeletedRows += idsToDeleteFromDb.length
        continue
      }

      const deletedRows = await attachmentRepository.deleteByIds(idsToDeleteFromDb)
      totalDeletedRows += deletedRows
    }
  } finally {
    await releaseCleanupLock(lockKey)
  }

  console.info(
    `[support-chat-cleanup] done selected=${totalSelected} storageDeleted=${totalDeletedStorage} rowsDeleted=${totalDeletedRows} storageErrors=${totalStorageErrors} dryRun=${isDryRun}`
  )
}

main()
  .catch(error => {
    console.error('[support-chat-cleanup][fatal]', error)
    process.exit(1)
  })
  .finally(async () => {
    await dbClient.$disconnect()
  })

