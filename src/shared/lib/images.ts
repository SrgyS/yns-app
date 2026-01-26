import { publicConfig } from '@/shared/config/public'

const supabaseBaseUrl = process.env.SUPABASE_URL
  ? `${process.env.SUPABASE_URL}/storage/v1/object/public`
  : ''

const storageBaseUrl = publicConfig.STORAGE_BASE_URL || supabaseBaseUrl

const normalizePath = (path: string) => path.replace(/^\/+/, '')
const withTrailingSlash = (value: string) =>
  value.endsWith('/') ? value : `${value}/`

export const resolveStorageUrl = (path: string) => {
  const isAbsolute = /^https?:\/\//.test(path)

  if (isAbsolute) {
    return path
  }

  if (!storageBaseUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('STORAGE_BASE_URL is not configured.')
    }
    return path.startsWith('/') ? path : `/${path}`
  }

  return `${withTrailingSlash(storageBaseUrl)}${normalizePath(path)}`
}

export const getImageUrl = (bucket: string, path: string) =>
  resolveStorageUrl(`${bucket}/${path}`)
