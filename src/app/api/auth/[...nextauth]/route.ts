import NextAuth from 'next-auth'
import { nextAuthConfig } from '@/kernel/lib/next-auth/next-auth-config'

const authHandler = NextAuth(nextAuthConfig)

export { authHandler as GET, authHandler as POST }
