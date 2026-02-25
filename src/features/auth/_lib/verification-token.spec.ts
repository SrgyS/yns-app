jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    verificationToken: {
      findFirst: jest.fn(),
    },
  },
}))

import { dbClient } from '@/shared/lib/db'
import {
  getVerificationTokenByEmail,
  getVerificationTokenByToken,
} from './verification-token'

describe('verification token queries', () => {
  beforeEach(() => {
    ;(dbClient.verificationToken.findFirst as jest.Mock).mockReset()
  })

  test('returns token by email and token', async () => {
    const record = { email: 'a@b.com', token: 't1' }
    ;(dbClient.verificationToken.findFirst as jest.Mock).mockResolvedValue(
      record
    )

    const byEmail = await getVerificationTokenByEmail('a@b.com')
    const byToken = await getVerificationTokenByToken('t1')

    expect(byEmail).toEqual(record)
    expect(byToken).toEqual(record)
  })

  test('returns null on errors', async () => {
    ;(dbClient.verificationToken.findFirst as jest.Mock).mockRejectedValue(
      new Error('db')
    )

    const byEmail = await getVerificationTokenByEmail('a@b.com')
    const byToken = await getVerificationTokenByToken('t1')

    expect(byEmail).toBeNull()
    expect(byToken).toBeNull()
  })
})
