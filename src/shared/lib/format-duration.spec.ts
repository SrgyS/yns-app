import { formatDuration } from './format-duration'

describe('formatDuration', () => {
  test('returns 00:00 for invalid input and formats seconds', () => {
    expect(formatDuration(null)).toBe('00:00')
    expect(formatDuration(undefined)).toBe('00:00')
    expect(formatDuration(Number.NaN)).toBe('00:00')
    expect(formatDuration(-1)).toBe('00:00')
    expect(formatDuration(65)).toBe('01:05')
  })
})
