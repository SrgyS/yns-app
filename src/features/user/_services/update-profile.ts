import { Profile } from '../_domain/types'
import { ProfileRepository } from '../_repositories/profile'
import { UserId } from '@/kernel/domain/user'
import { injectable } from 'inversify'

type UpdateProfile = {
  userId: UserId
  data: Partial<Profile>
}

@injectable()
export class UpdateProfileService {
  constructor(private profileRepository: ProfileRepository) {}
  async exec({ userId, data }: UpdateProfile): Promise<Profile> {
    return await this.profileRepository.update(userId, data)
  }
}
