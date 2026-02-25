import { generateTestLink } from './generate-test-link'

describe('generateTestLink', () => {
  test('builds auth callback url with params', () => {
    const result = generateTestLink({
      callbackUrl: 'https://app.example.com/return',
      token: 'token-1',
      email: 'user@example.com',
    })

    expect(result).toBe(
      'http://localhost/api/auth/callback/email?callbackUrl=https%3A%2F%2Fapp.example.com%2Freturn&token=token-1&email=user%40example.com'
    )
  })
})
