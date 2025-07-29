import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'

// import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { dbClient } from '@/shared/lib/db'
import { compact } from 'lodash-es'
import { privateConfig } from '@/shared/config/private'
import { AdapterUser } from 'next-auth/adapters'
import { injectable } from 'inversify'
import { CreateUserService } from '../../services/create-user'
import { AuthCredentialsService } from '@/entity/user/_services/auth-credentials'
import { UserRepository } from '@/entity/user/_repositories/user'

const prismaAdapter = PrismaAdapter(dbClient)

@injectable()
export class NextAuthConfig {
  constructor(
    private createUserService: CreateUserService,
    private userRepository: UserRepository,
    private authCredentialsService: AuthCredentialsService
  ) {}
  options: AuthOptions = {
    session: {
      strategy: 'jwt',
    },
    adapter: {
      ...prismaAdapter,
      createUser: async (
        data: Omit<AdapterUser, 'id'> & { password: string }
      ) => {
        return this.createUserService.exec(data)
      },
    } as AuthOptions['adapter'],
    events: {
      linkAccount: async ({ user }) => {
        await dbClient.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
      },
    },
    callbacks: {
      signIn: async ({ user, account }) => {
        //Allow OAuth withput email verification
        if (account?.type === 'oauth') {
          return true
        }
        const existingUser = await this.userRepository.findUserById(user.id)
        if (!existingUser || !existingUser.emailVerified) {
          return false
        }

        return true
      },
      jwt: async ({ token, user, trigger, session }) => {
        if (user) {
          token.id = user.id
          token.role = user.role
          token.picture = user.image
        }

        if (trigger === 'update' && session?.user?.image !== undefined) {
          token.picture = session.user.image
        }

        return token
      },
      session: async ({ session, token }) => {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role,
            image: token.picture,
          },
        }
      },
    },
    pages: {
      signIn: '/auth/sign-in',
      // TODO: add signOut and error
      // signOut: '/auth/sign-out',
      error: '/auth/error',
      verifyRequest: '/auth/verify-request',
      newUser: '/auth/new-user',
    },
    providers: compact([
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async credentials => {
          if (!credentials) {
            return null
          }
          const result = await this.authCredentialsService.exec(credentials)
          if (result?.success) {
            return result.user
          }
          if (result?.error === 'EMAIL_UNVERIFIED') {
            throw new Error('EmailUnverified')
          }

          return null
        },
      }),
      // EmailProvider({
      //   ...this.emailToken,
      //   server: {
      //     host: privateConfig.EMAIL_SERVER_HOST,
      //     port: parseInt(privateConfig.EMAIL_SERVER_PORT, 10),
      //     auth: {
      //       user: privateConfig.EMAIL_SERVER_USER,
      //       pass: privateConfig.EMAIL_SERVER_PASSWORD,
      //     },
      //   },
      //   from: privateConfig.EMAIL_FROM,
      // }),
      privateConfig.GOOGLE_ID &&
        privateConfig.GOOGLE_SECRET &&
        GoogleProvider({
          clientId: privateConfig.GOOGLE_ID,
          clientSecret: privateConfig.GOOGLE_SECRET,
        }),
      privateConfig.GITHUB_ID &&
        privateConfig.GITHUB_SECRET &&
        GithubProvider({
          clientId: privateConfig.GITHUB_ID,
          clientSecret: privateConfig.GITHUB_SECRET,
        }),
    ]),
  }

  get emailToken() {
    return privateConfig.TEST_EMAIL_TOKEN
      ? {
          generateVerificationToken: () => privateConfig.TEST_EMAIL_TOKEN ?? '',
          sendVerificationRequest: () =>
            console.log("we don't send emails in test mode"),
        }
      : {}
  }
}
