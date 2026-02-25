describe('createFileStorage', () => {
  const loadModule = async (nodeEnv?: string) => {
    jest.resetModules()
    const env = process.env as Record<string, string | undefined>
    env.NODE_ENV = nodeEnv

    jest.doMock('../_providers/minio', () => ({
      MinioStorage: class MinioStorage {},
    }))
    jest.doMock('../_providers/supabase', () => ({
      SupabaseStorage: class SupabaseStorage {},
    }))

    const storageModule = await import('./create-storage')
    const minioModule = await import('../_providers/minio')
    const supabaseModule = await import('../_providers/supabase')

    return {
      createFileStorage: storageModule.createFileStorage,
      MinioStorage: minioModule.MinioStorage,
      SupabaseStorage: supabaseModule.SupabaseStorage,
    }
  }

  test('uses Minio in development', async () => {
    const { createFileStorage, MinioStorage } = await loadModule('development')
    const storage = createFileStorage()
    expect(storage).toBeInstanceOf(MinioStorage)
  })

  test('uses Supabase otherwise', async () => {
    const { createFileStorage, SupabaseStorage } = await loadModule('production')
    const storage = createFileStorage()
    expect(storage).toBeInstanceOf(SupabaseStorage)
  })
})
