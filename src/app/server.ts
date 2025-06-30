import 'reflect-metadata'

import { CourseEntityModule } from '@/features/course/server'
import { UpdateProfileModule } from '@/features/update-profile/server'
import { UserEntityModule } from '@/features/user/server'
import { NextAuthModule } from '@/kernel/lib/next-auth/server'
import { Container } from 'inversify'
import { TrpcModule } from '@/kernel/lib/trpc/server'

export function createServer() {
  const container = new Container()

  container.load(
    NextAuthModule,
    CourseEntityModule,
    UserEntityModule,
    UpdateProfileModule,
    TrpcModule
  )

  return container
}

export const server = createServer()