import {
  ALLOWED_IMAGE_TYPES,
  AVATAR_IMAGE_MAX_SIZE_MB,
  DEFAULT_IMAGE_MAX_SIZE_MB,
} from './upload-constants'

describe('upload constants', () => {
  test('exposes size limits', () => {
    expect(DEFAULT_IMAGE_MAX_SIZE_MB).toBe(10)
    expect(AVATAR_IMAGE_MAX_SIZE_MB).toBe(5)
  })

  test('includes common image mime types', () => {
    expect(ALLOWED_IMAGE_TYPES.has('image/png')).toBe(true)
    expect(ALLOWED_IMAGE_TYPES.has('image/jpeg')).toBe(true)
    expect(ALLOWED_IMAGE_TYPES.has('image/webp')).toBe(true)
  })
})
