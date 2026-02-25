import { publicConfig } from '@/shared/config/public'

const storageBaseUrl = publicConfig.IMAGE_BASE_URL

export const resolveStorageUrl = (path: string) => {
  const isAbsolute = /^(https?:\/\/|data:|blob:)/.test(path)

  if (isAbsolute) {
    return path
  }

  // Если путь не начинается с /, добавляем его
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // Если настроен внешний IMAGE_BASE_URL (CDN / S3 / Supabase public URL)
  if (storageBaseUrl) {
    // Убираем trailing slash из base
    const base = storageBaseUrl.endsWith('/')
      ? storageBaseUrl.slice(0, -1)
      : storageBaseUrl

    // Проверяем, не начинается ли путь уже с base (для относительных путей типа /storage)
    // Это предотвращает двойное добавление префикса (например /storage/storage/...)
    if (base.startsWith('/') && normalizedPath.startsWith(base)) {
      return normalizedPath
    }

    return `${base}${normalizedPath}`
  }

  // Если нет внешнего URL, возвращаем как есть (будет работать через rewrite или локально)
  return normalizedPath
}

export const getImageUrl = (path: string, bucket?: string) => {
  const targetBucket = bucket ?? publicConfig.BUCKETS.MAIN

  // Если путь уже начинается с бакета, не добавляем его снова
  if (path.startsWith(`${targetBucket}/`)) {
    return resolveStorageUrl(path)
  }

  return resolveStorageUrl(`${targetBucket}/${path}`)
}

