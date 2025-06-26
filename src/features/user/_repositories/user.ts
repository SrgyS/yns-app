import { dbClient } from '@/shared/lib/db'
import { SharedUser, UserId } from '@/kernel/domain/user'

export class UserRepository {
  async getUserById(userId: UserId): Promise<SharedUser> {
    return dbClient.user.findUniqueOrThrow({
      where: { id: userId },
    })
  }

  async createUser(user: SharedUser): Promise<SharedUser> {
    return await dbClient.user.create({
      data: user,
    })
  }
}

export const userRepository = new UserRepository()
