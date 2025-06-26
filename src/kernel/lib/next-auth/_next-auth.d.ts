// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from 'next-auth'
import { SharedSession, SharedUser } from '@/kernel/domain/user'

declare module 'next-auth' {
  interface Session {
    user: SharedSession['user']
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends SharedUser {}
}
