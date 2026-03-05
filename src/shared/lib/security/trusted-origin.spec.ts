import { isTrustedRequestOrigin } from './trusted-origin'

describe('isTrustedRequestOrigin', () => {
  test('accepts allowed origin header', () => {
    const isTrusted = isTrustedRequestOrigin({
      requestUrl: 'https://app.local/api/trpc/supportChat.sendMessage',
      originHeader: 'https://app.local',
      hostHeader: 'app.local',
      publicAppUrl: 'https://app.local',
    })

    expect(isTrusted).toBe(true)
  })

  test('accepts allowed referer when origin is missing', () => {
    const isTrusted = isTrustedRequestOrigin({
      requestUrl: 'https://app.local/api/trpc/supportChat.sendMessage',
      refererHeader: 'https://app.local/platform/support-chat',
      hostHeader: 'app.local',
      publicAppUrl: 'https://app.local',
    })

    expect(isTrusted).toBe(true)
  })

  test('rejects foreign origin', () => {
    const isTrusted = isTrustedRequestOrigin({
      requestUrl: 'https://app.local/api/trpc/supportChat.sendMessage',
      originHeader: 'https://evil.example',
      hostHeader: 'app.local',
      publicAppUrl: 'https://app.local',
    })

    expect(isTrusted).toBe(false)
  })

  test('rejects http origin when trusted origin is https', () => {
    const isTrusted = isTrustedRequestOrigin({
      requestUrl: 'https://app.local/api/trpc/supportChat.sendMessage',
      originHeader: 'http://app.local',
      hostHeader: 'app.local',
      publicAppUrl: 'https://app.local',
    })

    expect(isTrusted).toBe(false)
  })

  test('rejects when both origin and referer are missing', () => {
    const isTrusted = isTrustedRequestOrigin({
      requestUrl: 'https://app.local/api/trpc/supportChat.sendMessage',
      hostHeader: 'app.local',
      publicAppUrl: 'https://app.local',
    })

    expect(isTrusted).toBe(false)
  })
})
