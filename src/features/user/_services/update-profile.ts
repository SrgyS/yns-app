import { Profile } from '../_domain/types'
import { createProfileAbility } from '../_domain/abbility'
import { AuthorizatoinError } from '@/shared/lib/errors'
import { profileRepository } from '../_repositories/profile'
import { SharedSession, UserId } from '@/kernel/domain/user'

type UpdateProfile = {
  userId: UserId
  data: Partial<Profile>
  session: SharedSession
}

export class UpdateProfileService {
  async exec({ userId, session, data }: UpdateProfile): Promise<Profile> {
    const profileAbility = createProfileAbility(session)

    if (!profileAbility.canUpdateProfile(userId)) {
      throw new AuthorizatoinError()
    }

    return await profileRepository.update(userId, data)
  }
}

export const updateProfileService = new UpdateProfileService()
