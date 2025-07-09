import { ContainerModule } from 'inversify'
import { NextAuthConfig } from './_next-auth-config'
import { SessionService } from './_session-service'

import { Controller } from '@/kernel/lib/trpc/server'
import { AuthCredentialsController } from '@/features/auth/_controller'

export { CreateUserService } from './_create-user-service'

export const NextAuthModule = new ContainerModule(context => {
  const { bind } = context
  bind(NextAuthConfig).toSelf()
  bind(SessionService).toSelf()
  bind(Controller).to(AuthCredentialsController)
})

export { NextAuthConfig, SessionService }
