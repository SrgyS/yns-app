import { injectable } from 'inversify'
import bcrypt from 'bcryptjs'
import { SharedUser } from '@/kernel/domain/user'
import { UserRepository } from '../_repositories/user'
import { emailSignInSchema } from '@/features/auth/schemas'
import z from 'zod'

@injectable()
export class AuthCredentialsService {
  constructor(private userRepository: UserRepository) {}
  /**
   * Валидирует учетные данные пользователя (email и пароль)
   * и возвращает объект SharedUser, если они действительны.
   *
   * @param credentials - Объект с email и опциональным паролем.
   * @returns SharedUser если учетные данные верны, иначе null.
   */
  async validateCredentials(
    credentials: z.infer<typeof emailSignInSchema>
  ): Promise<SharedUser | null> {
    const validatedFields = emailSignInSchema.safeParse(credentials)

    if (!validatedFields.success) {
      console.warn('Validation failed for credentials:', validatedFields.error)
      return null
    }

    const { email, password } = validatedFields.data

    const user = await this.userRepository.findByEmail(email)

    if (!user || !user.password) {
      return null
    }
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
    }
  }
}
