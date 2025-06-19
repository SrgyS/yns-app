// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from 'next-auth'
import { SessionEntity, UserEntity } from './_domain/types'

declare module 'next-auth' {
  interface Session {
    user: SessionEntity['user']
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends UserEntity {}
}