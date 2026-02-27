import {
  buildAttachmentCacheHeaders,
  isAttachmentNotModified,
} from './attachment-http-cache'

describe('attachment http cache', () => {
  const createRequest = (headers: Record<string, string>) => {
    const normalized = new Map(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
    )

    return {
      headers: {
        get: (name: string) => normalized.get(name.toLowerCase()) ?? null,
      },
    }
  }

  test('builds normalized headers', () => {
    const headers = buildAttachmentCacheHeaders({
      etag: 'abc',
      lastModified: new Date('2026-02-25T12:00:00.000Z'),
    })

    expect(headers.etag).toBe('"abc"')
    expect(headers.lastModified).toBe('Wed, 25 Feb 2026 12:00:00 GMT')
  })

  test('returns true when if-none-match contains exact etag', () => {
    const request = createRequest({
      'if-none-match': '"abc"',
    })

    const result = isAttachmentNotModified(request, {
      etag: 'abc',
      lastModified: null,
    })

    expect(result).toBe(true)
  })

  test('returns true when if-modified-since is newer than last-modified', () => {
    const request = createRequest({
      'if-modified-since': 'Wed, 25 Feb 2026 13:00:00 GMT',
    })

    const result = isAttachmentNotModified(request, {
      etag: null,
      lastModified: new Date('2026-02-25T12:00:00.000Z'),
    })

    expect(result).toBe(true)
  })

  test('returns false when validators are missing', () => {
    const request = createRequest({})

    const result = isAttachmentNotModified(request, {
      etag: null,
      lastModified: null,
    })

    expect(result).toBe(false)
  })
})
