jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    passwordResetToken: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { dbClient } from '@/shared/lib/db'
import {
  getPasswordResetTokenByEmail,
  getPasswordResetTokenByToken,
} from './password-reset-token'

describe('password reset token queries', () => {
  beforeEach(() => {
    ;(dbClient.passwordResetToken.findFirst as jest.Mock).mockReset()
    ;(dbClient.passwordResetToken.findUnique as jest.Mock).mockReset()
  })

  test('returns token by email and token', async () => {
    const record = { email: 'a@b.com', token: 't1' }
    ;(dbClient.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(
      record
    )
    ;(dbClient.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(
      record
    )

    const byEmail = await getPasswordResetTokenByEmail('a@b.com')
    const byToken = await getPasswordResetTokenByToken('t1')

    expect(byEmail).toEqual(record)
    expect(byToken).toEqual(record)
  })

  test('returns null on errors', async () => {
    ;(dbClient.passwordResetToken.findFirst as jest.Mock).mockRejectedValue(
      new Error('db')
    )
    ;(dbClient.passwordResetToken.findUnique as jest.Mock).mockRejectedValue(
      new Error('db')
    )

    const byEmail = await getPasswordResetTokenByEmail('a@b.com')
    const byToken = await getPasswordResetTokenByToken('t1')

    expect(byEmail).toBeNull()
    expect(byToken).toBeNull()
  })
})
