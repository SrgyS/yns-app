import { publicConfig } from '@/shared/config/public'

const imageBaseUrl = publicConfig.IMAGE_BASE_URL

export function resolvePracticeImagePath(relativePath: string | undefined) {
  if (!relativePath || !imageBaseUrl) {
    return relativePath
  }

  const normalizedBase = imageBaseUrl.endsWith('/')
    ? imageBaseUrl.slice(0, -1)
    : imageBaseUrl
  const normalizedPath = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath

  return `${normalizedBase}/${normalizedPath}`
}
