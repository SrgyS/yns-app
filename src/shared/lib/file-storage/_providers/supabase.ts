import { privateConfig } from '@/shared/config/private'
import { createClient } from '@supabase/supabase-js'
import {
  StoredFile,
  StoredFileDownload,
  StoredFileStreamDownload,
  StorageAccessLevel,
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
    accessLevel: StorageAccessLevel = 'public'
  ) {
    return this.upload(file, tag, userId, accessLevel)
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
    accessLevel: StorageAccessLevel
  ): Promise<StoredFile> {
    const fileExt = file.name.split('.').pop()
    const bucket = this.resolveBucket(accessLevel)
    const key = `${tag}/${userId}/${Date.now()}.${fileExt}`

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(key, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
        metadata: {
          owner: userId, // если используется RLS-политика
        },
      })

    if (error) throw error

    return {
      id: createId(),
      name: file.name,
      type: file.type,
      path: `${bucket}/${key}`,
      prefix: '/storage',
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
