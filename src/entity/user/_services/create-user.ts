import { CreateUserService } from '@/kernel/lib/next-auth/server'
import { injectable } from 'inversify'
import { UserRepository } from '../_repositories/user'
import { AdapterUser } from 'next-auth/adapters'
import { privateConfig } from '@/shared/config/private'
import { ROLES, SharedUser } from '@/kernel/domain/user'
import { generateId } from '@/shared/lib/id'
import bcrypt from 'bcryptjs'
import { generateVerificationToken } from '@/features/auth/_lib/tokens'
import { sendVerificationEmail } from '@/shared/lib/mail'

@injectable()
export class CreateUserServiceImpl implements CreateUserService {
  constructor(private userRepository: UserRepository) {}

  async exec(
    data: Omit<AdapterUser, 'id'> & { password?: string }
  ): Promise<AdapterUser> {
    // Check if user already exists
    const existingUser = await this.userRepository.findUserByEmail(data.email)
    if (existingUser) {
      throw new Error('Такой пользователь уже существует')
    }

    const adminEmails = privateConfig.ADMIN_EMAILS?.split(',') ?? []
    const role = adminEmails.includes(data.email) ? ROLES.ADMIN : ROLES.USER
    // Hash password if provided
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 12)
      : null

    const user: SharedUser = {
      ...data,
      id: generateId(),
      role,
      password: hashedPassword,
    }

    const verificationToken = await generateVerificationToken(data.email)

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    const res = await this.userRepository.create(user)

    return {
      ...res,
      emailVerified: res.emailVerified ?? null,
      password: null,
    }
  }
}