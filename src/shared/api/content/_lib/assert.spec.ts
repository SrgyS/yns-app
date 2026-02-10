import { isDefined } from './assert'

describe('isDefined', () => {
  test('filters out null and undefined only', () => {
    expect(isDefined(null)).toBe(false)
    expect(isDefined(undefined)).toBe(false)
    expect(isDefined('')).toBe(true)
    expect(isDefined(0)).toBe(true)
    expect(isDefined(false)).toBe(true)
  })
})
