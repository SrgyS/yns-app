import { CreateUserService } from '@/kernel/lib/next-auth/server'
import { injectable } from 'inversify'
import { UserRepository } from '../_repositories/user'
import { AdapterUser } from 'next-auth/adapters'
import { privateConfig } from '@/shared/config/private'
import { ROLES, SharedUser } from '@/kernel/domain/user'
import { generateId } from '@/shared/lib/id'

@injectable()
export class CreateUserServiceImpl implements CreateUserService {
  constructor(private profileRepository: UserRepository) {}

  async exec(data: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
        const adminEmails = privateConfig.ADMIN_EMAILS?.split(',') ?? []
        const role = adminEmails.includes(data.email) ? ROLES.ADMIN : ROLES.USER

        const user: SharedUser = {
          ...data,
          id: generateId(),
          role,
        }
        const res = await this.profileRepository.create(user )

        return {
          ...res,
          emailVerified: res.emailVerified ?? null,
        }
  }
}