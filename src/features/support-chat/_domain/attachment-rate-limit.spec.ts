import {
  __resetSupportChatAttachmentRateLimitForTests,
  assertSupportChatAttachmentRateLimit,
} from './attachment-rate-limit'

describe('attachment rate limit', () => {
  beforeEach(() => {
    __resetSupportChatAttachmentRateLimitForTests()
  })

  test('allows requests below limit', () => {
    let allowed = true
    for (let index = 0; index < 120; index += 1) {
      allowed = assertSupportChatAttachmentRateLimit('u1:ip1', 1_000 + index)
    }

    expect(allowed).toBe(true)
  })

  test('blocks request over the limit', () => {
    for (let index = 0; index < 120; index += 1) {
      assertSupportChatAttachmentRateLimit('u1:ip1', 1_000 + index)
    }

    const blocked = assertSupportChatAttachmentRateLimit('u1:ip1', 2_000)

    expect(blocked).toBe(false)
  })

  test('resets after window', () => {
    for (let index = 0; index < 120; index += 1) {
      assertSupportChatAttachmentRateLimit('u1:ip1', 1_000 + index)
    }

    const allowedAfterWindow = assertSupportChatAttachmentRateLimit(
      'u1:ip1',
      62_000
    )

    expect(allowedAfterWindow).toBe(true)
  })
})

