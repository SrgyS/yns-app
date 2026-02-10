jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    verificationToken: {
      delete: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('./verification-token', () => ({
  getVerificationTokenByEmail: jest.fn(),
}))
jest.mock('./password-reset-token', () => ({
  getPasswordResetTokenByEmail: jest.fn(),
}))

jest.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'token-id',
}))

import { dbClient } from '@/shared/lib/db'
import {
  generatePasswordResetToken,
  generateVerificationToken,
} from './tokens'
import { getVerificationTokenByEmail } from './verification-token'
import { getPasswordResetTokenByEmail } from './password-reset-token'

describe('auth tokens', () => {
  beforeEach(() => {
    ;(dbClient.verificationToken.delete as jest.Mock).mockReset()
    ;(dbClient.verificationToken.create as jest.Mock).mockReset()
    ;(dbClient.passwordResetToken.delete as jest.Mock).mockReset()
    ;(dbClient.passwordResetToken.create as jest.Mock).mockReset()
    ;(getVerificationTokenByEmail as jest.Mock).mockReset()
    ;(getPasswordResetTokenByEmail as jest.Mock).mockReset()
  })

  test('generateVerificationToken creates a new token when none exists', async () => {
    ;(getVerificationTokenByEmail as jest.Mock).mockResolvedValue(null)
    ;(dbClient.verificationToken.create as jest.Mock).mockResolvedValue({
      email: 'a@b.com',
      token: 'token-id',
    })

    const result = await generateVerificationToken('a@b.com')

    expect(dbClient.verificationToken.delete).not.toHaveBeenCalled()
    expect(dbClient.verificationToken.create).toHaveBeenCalledWith({
      data: {
        email: 'a@b.com',
        token: 'token-id',
        expires: expect.any(Date),
      },
    })
    expect(result).toEqual({
      email: 'a@b.com',
      token: 'token-id',
    })
  })

  test('generateVerificationToken deletes existing token first', async () => {
    ;(getVerificationTokenByEmail as jest.Mock).mockResolvedValue({
      email: 'a@b.com',
      token: 'old-token',
    })
    ;(dbClient.verificationToken.create as jest.Mock).mockResolvedValue({
      email: 'a@b.com',
      token: 'token-id',
    })

    await generateVerificationToken('a@b.com')

    expect(dbClient.verificationToken.delete).toHaveBeenCalledWith({
      where: {
        email_token: {
          email: 'a@b.com',
          token: 'old-token',
        },
      },
    })
  })

  test('generatePasswordResetToken creates a new token and deletes existing', async () => {
    ;(getPasswordResetTokenByEmail as jest.Mock).mockResolvedValue({
      email: 'a@b.com',
      token: 'old-reset',
    })
    ;(dbClient.passwordResetToken.create as jest.Mock).mockResolvedValue({
      email: 'a@b.com',
      token: 'token-id',
    })

    await generatePasswordResetToken('a@b.com')

    expect(dbClient.passwordResetToken.delete).toHaveBeenCalledWith({
      where: {
        email_token: {
          email: 'a@b.com',
          token: 'old-reset',
        },
      },
    })
    expect(dbClient.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        email: 'a@b.com',
        token: 'token-id',
        expires: expect.any(Date),
      },
    })
  })
})
