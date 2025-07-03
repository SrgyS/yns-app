import { dbClient } from '@/shared/lib/db'
import { SharedUser, UserId } from '@/kernel/domain/user'
import { injectable } from 'inversify'

@injectable()
export class UserRepository {
  async create(createData: SharedUser): Promise<SharedUser> {
    const user = dbClient.user.create({
      data: createData,
    })

    return user
  }

  async findByEmail(email: string): Promise<SharedUser | null> {
    return await dbClient.user.findUnique({
      where: { email },
    })
  }

  async findUserById(id: UserId): Promise<SharedUser | null> {
    return await dbClient.user.findUnique({
      where: { id },
    })
  }
}
