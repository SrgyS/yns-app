import { privateConfig } from '@/shared/config/private'
import { createClient } from '@supabase/supabase-js'
import { StoredFile } from '../types'
import { createId } from '@paralleldrive/cuid2'

export class SupabaseStorage {
  private supabase = createClient(
    privateConfig.SUPABASE_URL,
    privateConfig.SUPABASE_SERVICE_KEY
  )

  async uploadImage(file: File, tag: string, userId: string) {
    return this.upload(file, privateConfig.SUPABASE_IMAGE_BUCKET, tag, userId)
  }

  async upload(
    file: File,
    bucket: string,
    tag: string,
    userId: string
  ): Promise<StoredFile> {
    const fileExt = file.name.split('.').pop()
    const key = `${userId}/${tag}-${Date.now()}.${fileExt}`

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

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(key)

    return {
      id: createId(),
      name: file.name,
      type: file.type,
      path: data.publicUrl,
      prefix: '/storage',
    }
  }
}
