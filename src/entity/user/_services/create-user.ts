import { injectable } from 'inversify'
import { AdapterUser } from 'next-auth/adapters'
import bcrypt from 'bcryptjs'
import { UserRepository } from '../_repositories/user'
import { privateConfig } from '@/shared/config/private'
import { ROLES, SharedUser } from '@/kernel/domain/user'
import { generateId } from '@/shared/lib/id'
import { generateVerificationToken } from '@/features/auth/_lib/tokens'
import { sendVerificationEmail } from '@/shared/lib/mail'
import { CreateUserService } from '@/kernel/services/create-user'

@injectable()
export class CreateUserServiceImpl implements CreateUserService {
  constructor(private userRepository: UserRepository) {}

  async exec(
    data: Omit<AdapterUser, 'id'> & { password?: string }
  ): Promise<AdapterUser> {
    // Check if user already exists
    const existingUser = await this.userRepository.findUserByEmail(data.email)
    if (existingUser) {
      throw new Error('Пользователь с таким email уже зарегистрирован')
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
