import { MinioStorage } from '../_providers/minio'
import { SupabaseStorage } from '../_providers/supabase'

const strategy = process.env.NODE_ENV

export function createFileStorage() {
  if (strategy === 'development') {
    return new MinioStorage()
  }
  return new SupabaseStorage()
}
