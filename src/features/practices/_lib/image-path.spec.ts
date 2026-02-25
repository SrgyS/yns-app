describe('resolvePracticeImagePath', () => {
  const loadResolver = (baseUrl?: string) => {
    jest.resetModules()
    jest.doMock('@/shared/config/public', () => ({
      publicConfig: { IMAGE_BASE_URL: baseUrl ?? '' },
    }))
    let resolver: (path?: string) => string | undefined
    jest.isolateModules(() => {
      const imagePathModule =
        jest.requireActual<typeof import('./image-path')>('./image-path')
      resolver = imagePathModule.resolvePracticeImagePath
    })
    return resolver!
  }

  test('joins base url and normalizes slashes', () => {
    const resolvePracticeImagePath = loadResolver('https://cdn.example.com/')
    expect(resolvePracticeImagePath('/img/a.webp')).toBe(
      'https://cdn.example.com/img/a.webp'
    )
    expect(resolvePracticeImagePath('img/b.webp')).toBe(
      'https://cdn.example.com/img/b.webp'
    )
  })

  test('returns input when base url or path is missing', () => {
    const resolvePracticeImagePath = loadResolver('')
    expect(resolvePracticeImagePath('img/a.webp')).toBe('img/a.webp')
    expect(resolvePracticeImagePath(undefined)).toBeUndefined()
  })
})
