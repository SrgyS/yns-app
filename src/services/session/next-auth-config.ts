import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { dbClient } from '@/shared/lib/db'
import { compact } from 'lodash-es'
import { privateConfig } from '@/shared/lib/config/private'

export const nextAuthConfig: AuthOptions = {
  adapter: PrismaAdapter(dbClient) as AuthOptions['adapter'],
  providers: compact([
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
