const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL

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
