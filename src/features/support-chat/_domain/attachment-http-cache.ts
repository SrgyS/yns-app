type AttachmentCacheSnapshot = {
  etag: string | null
  lastModified: Date | null
}

type HeaderReader = {
  get: (name: string) => string | null
}

type RequestLike = {
  headers: HeaderReader
}

type AttachmentCacheHeaders = {
  etag?: string
  lastModified?: string
}

const normalizeEtag = (etag: string): string => {
  const trimmed = etag.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
  }

  return `"${trimmed.replaceAll('"', '')}"`
}

const parseIfNoneMatch = (value: string | null): string[] => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => normalizeEtag(item))
}

const parseIfModifiedSince = (value: string | null): Date | null => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

export const buildAttachmentCacheHeaders = (
  snapshot: AttachmentCacheSnapshot
): AttachmentCacheHeaders => {
  const headers: AttachmentCacheHeaders = {}

  if (snapshot.etag) {
    headers.etag = normalizeEtag(snapshot.etag)
  }

  if (snapshot.lastModified) {
    headers.lastModified = snapshot.lastModified.toUTCString()
  }

  return headers
}

export const isAttachmentNotModified = (
  request: RequestLike,
  snapshot: AttachmentCacheSnapshot
): boolean => {
  const ifNoneMatchValues = parseIfNoneMatch(request.headers.get('if-none-match'))
  if (ifNoneMatchValues.length > 0 && snapshot.etag) {
    const targetEtag = normalizeEtag(snapshot.etag)

    if (ifNoneMatchValues.includes('*')) {
      return true
    }

    if (ifNoneMatchValues.includes(targetEtag)) {
      return true
    }
  }

  const ifModifiedSince = parseIfModifiedSince(request.headers.get('if-modified-since'))
  if (!ifModifiedSince || !snapshot.lastModified) {
    return false
  }

  return snapshot.lastModified.getTime() <= ifModifiedSince.getTime()
}
