import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { dbClient } from '@/shared/lib/db'
import { compact } from 'lodash-es'
import { privateConfig } from '@/shared/config/private'
import { ROLES, SharedUser } from '@/kernel/domain/user'
import { generateId } from '@/shared/lib/id'

const prismaAdapter = PrismaAdapter(dbClient)

const emailToken = privateConfig.TEST_EMAIL_TOKEN
  ? {
      generateVerificationToken: () => privateConfig.TEST_EMAIL_TOKEN ?? '',
      sendVerificationRequest: () => console.log("we don't send emails in test mode"),
    }
  : {}

export const nextAuthConfig: AuthOptions = {
  adapter: {
    ...prismaAdapter,
    createUser: async (data: SharedUser) => {
      const adminEmails = privateConfig.ADMIN_EMAILS?.split(',') ?? []
      const role = adminEmails.includes(data.email) ? ROLES.ADMIN : ROLES.USER

      const user: SharedUser = {
        ...data,
        id: generateId(),
        role,
      }

      return await dbClient.user.create({ data: user })
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
    EmailProvider({
      ...emailToken,
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
