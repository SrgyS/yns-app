describe('images helpers', () => {
  const loadModule = async (options: {
    imageBaseUrl?: string
    supabaseUrl?: string
    nodeEnv?: string
  }) => {
    jest.resetModules()
    const env = process.env as Record<string, string | undefined>
    if (options.supabaseUrl === undefined) {
      delete env.SUPABASE_URL
    } else {
      env.SUPABASE_URL = options.supabaseUrl
    }
    env.NODE_ENV = options.nodeEnv ?? 'test'

    jest.doMock('@/shared/config/public', () => ({
      publicConfig: {
        IMAGE_BASE_URL: options.imageBaseUrl ?? '',
      },
    }))

    return await import('./images')
  }

  test('uses IMAGE_BASE_URL when provided', async () => {
    const { resolveStorageUrl } = await loadModule({
      imageBaseUrl: 'https://cdn.example.com/assets',
    })
    expect(resolveStorageUrl('bucket/img.png')).toBe(
      'https://cdn.example.com/assets/bucket/img.png'
    )
  })

  test('uses supabase base url when no IMAGE_BASE_URL', async () => {
    const { resolveStorageUrl } = await loadModule({
      supabaseUrl: 'https://supabase.example.com',
    })
    expect(resolveStorageUrl('bucket/img.png')).toBe(
      'https://supabase.example.com/storage/v1/object/public/bucket/img.png'
    )
  })

  test('returns absolute urls as-is and warns when no base url', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { resolveStorageUrl } = await loadModule({})

    expect(resolveStorageUrl('https://example.com/img.png')).toBe(
      'https://example.com/img.png'
    )
    expect(resolveStorageUrl('img.png')).toBe('/img.png')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
