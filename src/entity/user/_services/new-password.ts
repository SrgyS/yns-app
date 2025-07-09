import { injectable } from 'inversify'
import { UserRepository } from '../_repositories/user'
import { z } from 'zod'
import { newPasswordSchemaWithToken } from '@/features/auth/schemas'
import { TRPCError } from '@trpc/server'
import { getPasswordResetTokenByToken } from '@/features/auth/_lib/password-reset-token'
import { dbClient } from '@/shared/lib/db'
import bcrypt from 'bcryptjs'

@injectable()
export class NewPasswordService {
  constructor(private userRepository: UserRepository) {}

  async exec(values: z.infer<typeof newPasswordSchemaWithToken>) {
    const validatedFields = newPasswordSchemaWithToken.safeParse(values)

    if (!validatedFields.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Неверные данные',
      })
    }

    const { password, token } = validatedFields.data

    if (!token) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Token не найден или невалиден',
      })
    }

    const existingToken = await getPasswordResetTokenByToken(token)

    if (!existingToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Token не найден или невалиден',
      })
    }

    if (new Date(existingToken.expires) < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Token просрочен',
      })
    }

    const existingUser = await this.userRepository.findUserByEmail(
      existingToken.email
    )

    if (!existingUser) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Email не найден',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await this.userRepository.update(existingUser.id, {
      password: hashedPassword,
    })

    await dbClient.passwordResetToken.delete({
      where: {
        email_token: { email: existingToken.email, token: existingToken.token },
      },
    })

    return { success: 'Пароль успешно изменен!' }
  }
}
