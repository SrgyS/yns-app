jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: () => ({}),
}))

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: (config: unknown) => ({ id: 'google', config }),
}))

jest.mock('next-auth/providers/github', () => ({
  __esModule: true,
  default: (config: unknown) => ({ id: 'github', config }),
}))

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: (config: { authorize: (cred: unknown) => unknown }) => ({
    id: 'credentials',
    authorize: config.authorize,
  }),
}))

jest.mock('@/shared/config/private', () => ({
  privateConfig: {
    TEST_EMAIL_TOKEN: 'test-token',
    GOOGLE_ID: 'gid',
    GOOGLE_SECRET: 'gsecret',
    GITHUB_ID: 'hid',
    GITHUB_SECRET: 'hsecret',
  },
}))

jest.mock('@/shared/lib/db', () => ({
  dbClient: {
    user: {
      update: jest.fn(),
    },
  },
}))

import { NextAuthConfig } from './_next-auth-config'
import { dbClient } from '@/shared/lib/db'

describe('NextAuthConfig callbacks', () => {
  const createUserService = { exec: jest.fn() }
  const userRepository = { findUserById: jest.fn() }
  const authCredentialsService = { exec: jest.fn() }

  beforeEach(() => {
    createUserService.exec.mockReset()
    userRepository.findUserById.mockReset()
    authCredentialsService.exec.mockReset()
    ;(dbClient.user.update as jest.Mock).mockReset()
  })

  test('signIn allows oauth and blocks unverified credentials', async () => {
    const config = new NextAuthConfig(
      createUserService as any,
      userRepository as any,
      authCredentialsService as any
    )

    const oauthResult = await config.options.callbacks!.signIn!({
      user: { id: 'u1' } as any,
      account: { type: 'oauth' } as any,
    })
    expect(oauthResult).toBe(true)

    userRepository.findUserById.mockResolvedValue({
      id: 'u2',
      emailVerified: null,
    })
    const credResult = await config.options.callbacks!.signIn!({
      user: { id: 'u2' } as any,
      account: { type: 'credentials' } as any,
    })
    expect(credResult).toBe(false)
  })

  test('jwt and session callbacks map fields', async () => {
    const config = new NextAuthConfig(
      createUserService as any,
      userRepository as any,
      authCredentialsService as any
    )

    const token = await config.options.callbacks!.jwt!({
      token: {},
      user: { id: 'u1', role: 'USER', image: 'img', name: 'Name' } as any,
      trigger: undefined,
      session: undefined,
    })
    expect(token).toMatchObject({
      id: 'u1',
      role: 'USER',
      picture: 'img',
      name: 'Name',
    })

    const updated = await config.options.callbacks!.jwt!({
      token,
      user: undefined,
      trigger: 'update',
      session: { user: { image: 'new-img', name: 'New' } } as any,
    })
    expect(updated).toMatchObject({ picture: 'new-img', name: 'New' })

    const session = await config.options.callbacks!.session!({
      session: { user: { email: 'a@b.com' } } as any,
      token: updated as any,
    })
    expect(session.user).toMatchObject({
      id: 'u1',
      role: 'USER',
      image: 'new-img',
      name: 'New',
    })
  })

  test('credentials authorize handles success and email unverified', async () => {
    const config = new NextAuthConfig(
      createUserService as any,
      userRepository as any,
      authCredentialsService as any
    )
    const provider = config.options.providers?.find(
      entry => (entry as { id?: string }).id === 'credentials'
    ) as { authorize: (cred: unknown) => Promise<unknown> }

    authCredentialsService.exec.mockResolvedValue({
      success: true,
      user: { id: 'u1' },
    })
    const user = await provider.authorize({ email: 'a', password: 'b' })
    expect(user).toEqual({ id: 'u1' })

    authCredentialsService.exec.mockResolvedValue({
      success: false,
      error: 'EMAIL_UNVERIFIED',
    })
    await expect(
      provider.authorize({ email: 'a', password: 'b' })
    ).rejects.toThrow('EmailUnverified')
  })

  test('emailToken returns test provider when configured', () => {
    const config = new NextAuthConfig(
      createUserService as any,
      userRepository as any,
      authCredentialsService as any
    )

    expect(typeof config.emailToken.generateVerificationToken).toBe('function')
  })
})
