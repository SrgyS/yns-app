import { server } from '@/app/server'
import { NextAuthConfig } from '@/kernel/lib/next-auth/server'
import NextAuth from 'next-auth'

const authHandler = NextAuth(server.get(NextAuthConfig).options)

export { authHandler as GET, authHandler as POST }
