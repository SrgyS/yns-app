import { formatDate, formatDateTime } from './format-date'

describe('formatDate utilities', () => {
  test('formats valid dates and returns placeholder for empty', () => {
    const date = new Date(2024, 0, 2, 3, 4, 5)
    expect(formatDate(date)).toBe('02.01.2024')
    expect(formatDateTime(date)).toBe('02.01.2024 03:04')
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })

  test('returns input string for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
  })
})
