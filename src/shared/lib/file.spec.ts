import { validateFileSize } from './file'

describe('validateFileSize', () => {
  test('returns false when file exceeds size limit', () => {
    const big = new File(['x'.repeat(6 * 1024 * 1024)], 'big.txt')
    expect(validateFileSize(big, 5)).toBe(false)
  })

  test('returns true when file fits size limit', () => {
    const small = new File(['x'.repeat(1024)], 'small.txt')
    expect(validateFileSize(small, 5)).toBe(true)
  })
})
