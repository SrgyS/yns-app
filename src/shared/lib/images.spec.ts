describe('images helpers', () => {
  const loadModule = async (options: {
    imageBaseUrl?: string
    imageBucket?: string
    nodeEnv?: string
  }) => {
    jest.resetModules()
    const env = process.env as Record<string, string | undefined>
    env.NODE_ENV = options.nodeEnv ?? 'test'

    jest.doMock('@/shared/config/public', () => ({
      publicConfig: {
        IMAGE_BASE_URL: options.imageBaseUrl ?? '',
        BUCKETS: {
          MAIN: options.imageBucket ?? 'images',
        },
      },
    }))

    return await import('./images')
  }

  describe('resolveStorageUrl', () => {
    test('uses IMAGE_BASE_URL when provided', async () => {
      const { resolveStorageUrl } = await loadModule({
        imageBaseUrl: 'https://cdn.example.com/assets',
      })
      expect(resolveStorageUrl('bucket/img.png')).toBe(
        'https://cdn.example.com/assets/bucket/img.png'
      )
    })

    test('returns relative path when no IMAGE_BASE_URL', async () => {
      const { resolveStorageUrl } = await loadModule({})
      expect(resolveStorageUrl('bucket/img.png')).toBe('/bucket/img.png')
    })

    test('returns absolute urls as-is', async () => {
      const { resolveStorageUrl } = await loadModule({})

      expect(resolveStorageUrl('https://example.com/img.png')).toBe(
        'https://example.com/img.png'
      )
      expect(resolveStorageUrl('blob:http://localhost/123')).toBe(
        'blob:http://localhost/123'
      )
      expect(resolveStorageUrl('data:image/png;base64,123')).toBe(
        'data:image/png;base64,123'
      )
    })

    test('handles double slashes correctly', async () => {
      const { resolveStorageUrl } = await loadModule({
        imageBaseUrl: 'https://cdn.example.com/',
      })

      expect(resolveStorageUrl('/bucket/img.png')).toBe(
        'https://cdn.example.com/bucket/img.png'
      )
    })

    test('is idempotent for relative base url (minio case)', async () => {
      const { resolveStorageUrl } = await loadModule({
        imageBaseUrl: '/storage',
      })

      // First resolution
      const first = resolveStorageUrl('images/hero.jpg')
      expect(first).toBe('/storage/images/hero.jpg')

      // Second resolution (passed already resolved path)
      const second = resolveStorageUrl(first)
      expect(second).toBe('/storage/images/hero.jpg') // Should NOT be /storage/storage/images/hero.jpg
    })
  })

  describe('getImageUrl', () => {
    test('prepends default bucket if missing', async () => {
      const { getImageUrl } = await loadModule({
        imageBucket: 'default-bucket',
      })
      expect(getImageUrl('hero.png')).toBe('/default-bucket/hero.png')
    })

    test('uses provided bucket', async () => {
      const { getImageUrl } = await loadModule({})
      expect(getImageUrl('hero.png', 'other-bucket')).toBe(
        '/other-bucket/hero.png'
      )
    })

    test('does not prepend bucket if already present', async () => {
      const { getImageUrl } = await loadModule({
        imageBucket: 'images',
      })
      expect(getImageUrl('images/hero.png')).toBe('/images/hero.png')
    })

    test('resolves with base url', async () => {
      const { getImageUrl } = await loadModule({
        imageBaseUrl: 'https://cdn.com',
        imageBucket: 'images',
      })
      expect(getImageUrl('hero.png')).toBe('https://cdn.com/images/hero.png')
    })
  })
})
