import {
  assertSseRateLimit,
  decrementSseConnectionCounters,
  getSseConnectionCountForIp,
  getSseConnectionCountForUser,
  hasExceededSseConnectionLimits,
  incrementSseConnectionCounters,
  resetSseSecurityState,
  stringifySseData,
  toSseChunk,
} from './support-chat-sse-security'

describe('support chat SSE security helpers', () => {
  beforeEach(() => {
    resetSseSecurityState()
  })

  test('rate limiter blocks after configured threshold per key', () => {
    for (let index = 0; index < 20; index += 1) {
      expect(assertSseRateLimit('user-1:1.1.1.1')).toBe(true)
    }

    expect(assertSseRateLimit('user-1:1.1.1.1')).toBe(false)
  })

  test('connection cap blocks when user exceeds parallel limit', () => {
    const userId = 'user-1'
    const ip = '1.1.1.1'

    incrementSseConnectionCounters(userId, ip)
    incrementSseConnectionCounters(userId, ip)
    const third = incrementSseConnectionCounters(userId, ip)
    const fourth = incrementSseConnectionCounters(userId, ip)

    expect(hasExceededSseConnectionLimits(third.userConnections, third.ipConnections)).toBe(false)
    expect(
      hasExceededSseConnectionLimits(fourth.userConnections, fourth.ipConnections)
    ).toBe(true)
  })

  test('rejects malformed cyclic payload serialization safely', () => {
    const cyclic: { self?: unknown } = {}
    cyclic.self = cyclic

    expect(stringifySseData(cyclic)).toBeNull()
    expect(toSseChunk('message.created', cyclic)).toBeNull()
  })

  test('cleanup decrements connection counters', () => {
    const userId = 'user-1'
    const ip = '2.2.2.2'

    incrementSseConnectionCounters(userId, ip)
    incrementSseConnectionCounters(userId, ip)
    expect(getSseConnectionCountForUser(userId)).toBe(2)
    expect(getSseConnectionCountForIp(ip)).toBe(2)

    decrementSseConnectionCounters(userId, ip)
    decrementSseConnectionCounters(userId, ip)

    expect(getSseConnectionCountForUser(userId)).toBe(0)
    expect(getSseConnectionCountForIp(ip)).toBe(0)
  })
})
