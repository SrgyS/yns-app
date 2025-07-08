import { ContainerModule } from 'inversify'
import { GetProfileService } from './_services/get-profile'
import { UpdateProfileService } from './_services/update-profile'
import { ProfileRepository } from './_repositories/profile'
import { CreateUserService } from '@/kernel/lib/next-auth/server'
import { CreateUserServiceImpl } from './_services/create-user'
import { UserRepository } from './_repositories/user'
import { AuthCredentialsService } from './_services/auth-credentials'
import { VerificationTokenService } from './_services/new-verification'

export const UserEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetProfileService).toSelf()
  bind(UpdateProfileService).toSelf()
  bind(ProfileRepository).toSelf()
  bind(UserRepository).toSelf()
  bind(CreateUserService).to(CreateUserServiceImpl)
  bind(AuthCredentialsService).toSelf()
  bind(VerificationTokenService).toSelf()
})

export { UpdateProfileService, GetProfileService }
