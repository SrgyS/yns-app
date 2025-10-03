import { dbClient } from '@/shared/lib/db'
import { UserId } from '@/kernel/domain/user'
import { profileSchema, Profile } from '../client'
import z from 'zod'
import { injectable } from 'inversify'

@injectable()
export class ProfileRepository {
  async update(userId: UserId, data: Partial<Profile>): Promise<Profile> {
    const user = await dbClient.user.update({
      where: { id: userId },
      data,
    })

    return profileSchema.parse(user satisfies z.input<typeof profileSchema>)
  }

  async getProfileByUserId(userId: UserId): Promise<Profile> {
    const user = await dbClient.user.findUniqueOrThrow({
      where: { id: userId },
    })
    return profileSchema.parse(user satisfies z.input<typeof profileSchema>)
  }
}
