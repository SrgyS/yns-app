import 'reflect-metadata'

import { CourseEntityModule } from '@/entity/course/module'
import { CoursesListModule } from '@/features/courses-list/module'
import { UpdateProfileModule } from '@/features/update-profile/server'
import { UserEntityModule } from '@/entity/user/server'
import { NextAuthModule } from '@/kernel/lib/next-auth/server'
import { Container } from 'inversify'
import { TrpcModule } from '@/kernel/lib/trpc/module'
import { CourseDetailsModule } from '@/features/course-details/server'

export function createServer() {
  const container = new Container()

  container.load(
    NextAuthModule,
    CoursesListModule,
    CourseEntityModule,
    UserEntityModule,
    UpdateProfileModule,
    TrpcModule,
    CourseDetailsModule
  )

  return container
}

export const server = createServer()