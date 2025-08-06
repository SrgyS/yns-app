import { ContainerModule } from 'inversify'
import { GetProfileService } from './_services/get-profile'
import { UpdateProfileService } from './_services/update-profile'
import { ProfileRepository } from './_repositories/profile'

import { CreateUserServiceImpl } from './_services/create-user'
import { UserRepository } from './_repositories/user'
import { AuthCredentialsService } from './_services/auth-credentials'
import { VerificationTokenService } from './_services/new-verification'
import { NewPasswordService } from './_services/new-password'
import { ResetPasswordService } from './_services/reset-password'
import { CreateUserService } from '@/kernel/services/create-user'

export const UserEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetProfileService).toSelf()
  bind(UpdateProfileService).toSelf()
  bind(ProfileRepository).toSelf()
  bind(UserRepository).toSelf()
  bind(CreateUserService).to(CreateUserServiceImpl)
  bind(AuthCredentialsService).toSelf()
  bind(VerificationTokenService).toSelf()
  bind(ResetPasswordService).toSelf()
  bind(NewPasswordService).toSelf()
})

export { UpdateProfileService, GetProfileService }
