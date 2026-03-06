import { privateConfig } from '@/shared/config/private'
import { createClient } from '@supabase/supabase-js'
import {
  StoredFile,
  StoredFileDownload,
  StoredFileStreamDownload,
  StorageAccessLevel,
  UploadFileOptions,
} from '../types'
import { createId } from '@paralleldrive/cuid2'

export class SupabaseStorage {
  private supabase = createClient(
    privateConfig.SUPABASE_URL,
    privateConfig.SUPABASE_SERVICE_KEY
  )

  async uploadImage(file: File, tag: string, userId: string) {
    return this.upload(file, tag, userId, 'public')
  }

  async uploadFile(
    file: File,
    tag: string,
    userId: string,
    accessLevel: StorageAccessLevel = 'public',
    options?: UploadFileOptions
  ) {
    return this.upload(file, tag, userId, accessLevel, options)
  }

  async downloadByPath(path: string): Promise<StoredFileDownload> {
    const [bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    if (!bucket || !key) {
      throw new Error('Invalid storage path')
    }

    const { data, error } = await this.supabase.storage.from(bucket).download(key)

    if (error) {
      throw error
    }

    const contentType = data.type || 'application/octet-stream'
    const body = new Uint8Array(await data.arrayBuffer())

    return {
      body,
      contentType,
    }
  }

  async downloadStreamByPath(path: string): Promise<StoredFileStreamDownload> {
    const [bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    if (!bucket || !key) {
      throw new Error('Invalid storage path')
    }

    const { data, error } = await this.supabase.storage.from(bucket).download(key)

    if (error) {
      throw error
    }

    return {
      body: data.stream() as ReadableStream<Uint8Array>,
      contentType: data.type || 'application/octet-stream',
      contentLength: data.size,
    }
  }

  async deleteByPath(path: string): Promise<void> {
    const [bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    if (!bucket || !key) {
      throw new Error('Invalid storage path')
    }

    const { error } = await this.supabase.storage.from(bucket).remove([key])

    if (error) {
      throw error
    }
  }

  async upload(
    file: File,
    tag: string,
    userId: string,
    accessLevel: StorageAccessLevel,
    options?: UploadFileOptions
  ): Promise<StoredFile> {
    const fileExt = file.name.split('.').pop()
    const bucket = this.resolveBucket(accessLevel)
    const key = `${tag}/${userId}/${Date.now()}.${fileExt}`

    if (options?.signal?.aborted) {
      throw new Error('Upload aborted')
    }

    let isAborted = false
    let abortPromiseReject: ((reason?: unknown) => void) | null = null
    const abortPromise = new Promise<never>((_, reject) => {
      abortPromiseReject = reject
    })
    const abortListener = () => {
      isAborted = true
      abortPromiseReject?.(new Error('Upload aborted'))
    }
    options?.signal?.addEventListener('abort', abortListener)

    const uploadPromise = this.supabase.storage.from(bucket).upload(key, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
      metadata: {
        owner: userId, // если используется RLS-политика
      },
    })

    const handleAbortAfterUpload = async () => {
      if (!isAborted) {
        return
      }

      await this.safeDeleteObject(bucket, key)
      throw new Error('Upload aborted')
    }

    const handleAbortDuringUpload = async (): Promise<never> => {
      try {
        const uploadResult = await uploadPromise
        if (!uploadResult.error) {
          await this.safeDeleteObject(bucket, key)
        }
      } catch {
        // Upload request can fail because of abort/network issues. In this path
        // there is no committed object to remove.
      }

      throw new Error('Upload aborted')
    }

    let error: Error | null = null
    try {
      const result = await Promise.race([uploadPromise, abortPromise]).catch(
        async error => {
          if (!isAborted) {
            throw error
          }

          return handleAbortDuringUpload()
        }
      )
      error = result.error
    } finally {
      options?.signal?.removeEventListener('abort', abortListener)
    }

    if (error) {
      throw error
    }

    await handleAbortAfterUpload()

    return {
      id: createId(),
      name: file.name,
      type: file.type,
      path: `${bucket}/${key}`,
      prefix: '/storage',
    }
  }

  private async safeDeleteObject(bucket: string, key: string): Promise<void> {
    try {
      await this.supabase.storage.from(bucket).remove([key])
    } catch {
      // best effort cleanup for aborted/failed uploads
    }
  }

  private resolveBucket(accessLevel: StorageAccessLevel) {
    const deprecatedBucket = privateConfig.SUPABASE_IMAGE_BUCKET
    if (accessLevel === 'private') {
      const privateBucket = privateConfig.SUPABASE_PRIVATE_BUCKET ?? deprecatedBucket
      if (privateBucket) {
        return privateBucket
      }
    }

    const publicBucket = privateConfig.SUPABASE_PUBLIC_BUCKET ?? deprecatedBucket
    if (publicBucket) {
      return publicBucket
    }

    throw new Error('Supabase bucket is not configured')
  }
}
