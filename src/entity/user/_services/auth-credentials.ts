import { injectable } from 'inversify'
import bcrypt from 'bcryptjs'
import { SharedUser } from '@/kernel/domain/user'
import { UserRepository } from '../_repositories/user'
import { emailSignInSchema } from '@/features/auth/schemas'
import z from 'zod'
import { generateVerificationToken } from '@/features/auth/_lib/tokens'
import { sendVerificationEmail } from '@/shared/lib/mail'

export type AuthResult =
  | { success: true; user: SharedUser }
  | { success: false; error: 'EMAIL_UNVERIFIED' }
  | null

@injectable()
export class AuthCredentialsService {
  constructor(private userRepository: UserRepository) {}
  /**
   * Валидирует учетные данные пользователя (email и пароль)
   * и возвращает объект SharedUser, если они действительны.
   *
   * @param credentials - Объект с email и опциональным паролем.
   * @returns SharedUser если учетные данные верны и status верификации email или null, если нет.
   */
  async validateCredentials(
    credentials: z.infer<typeof emailSignInSchema>
  ): Promise<AuthResult> {
    const validatedFields = emailSignInSchema.safeParse(credentials)

    if (!validatedFields.success) {
      return null
    }

    const { email, password } = validatedFields.data

    const existingUser = await this.userRepository.findUserByEmail(email)

    if (!existingUser || !existingUser.email || !existingUser.password) {
      return null
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    )

    if (!isValidPassword) {
      return null
    }

  if (!existingUser?.emailVerified) {
      const verificationToken = await generateVerificationToken(
        validatedFields.data.email
      )

      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      )

        return {
          success: false,
          error: 'EMAIL_UNVERIFIED',
        }
      }

      return {
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          name: existingUser.name,
          image: existingUser.image,
          emailVerified: existingUser.emailVerified,
        },
      }
  }
}
