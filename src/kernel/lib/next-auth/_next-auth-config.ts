import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { dbClient } from '@/shared/lib/db'
import { compact } from 'lodash-es'
import { privateConfig } from '@/shared/config/private'
import { AdapterUser } from 'next-auth/adapters'
import { injectable } from 'inversify'
import { CreateUserService } from './_create-user-service'

const prismaAdapter = PrismaAdapter(dbClient)

@injectable()
export class NextAuthConfig {
  constructor(private createUserService: CreateUserService) {}
  options: AuthOptions = {
    adapter: {
      ...prismaAdapter,
      createUser: async (data: Omit<AdapterUser, 'id'>& { password: string }) => {
        return this.createUserService.exec(data)
      },
    } as AuthOptions['adapter'],
    callbacks: {
      session: async ({ session, user }) => {
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
            role: user.role,
          },
        }
      },
    },
    pages: {
      signIn: '/auth/sign-in',
      // TODO: add signOut and error
      // signOut: '/auth/sign-out',
      // error: '/auth/error',
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
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }
          return null
        },
      }),
      EmailProvider({
        ...this.emailToken,
        server: {
          host: privateConfig.EMAIL_SERVER_HOST,
          port: parseInt(privateConfig.EMAIL_SERVER_PORT, 10),
          auth: {
            user: privateConfig.EMAIL_SERVER_USER,
            pass: privateConfig.EMAIL_SERVER_PASSWORD,
          },
        },
        from: privateConfig.EMAIL_FROM,
      }),
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
