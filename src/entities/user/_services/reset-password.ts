import { injectable } from 'inversify'
import { UserRepository } from '../_repositories/user'
import { z } from 'zod'
import { resetPasswordSchema } from '@/features/auth/schemas'
import { TRPCError } from '@trpc/server'
import { generatePasswordResetToken } from '@/features/auth/_lib/tokens'
import { sendResetPasswordEmail } from '@/shared/lib/mail'

@injectable()
export class ResetPasswordService {
  constructor(private userRepository: UserRepository) {}

  async exec(values: z.infer<typeof resetPasswordSchema>) {
    const validatedFields = resetPasswordSchema.safeParse(values)

    if (!validatedFields.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Невалидные данные формы',
      })
    }
    const { email } = validatedFields.data

    const existingUser = await this.userRepository.findUserByEmail(email)

    if (!existingUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'email не найден',
      })
    }

    const passwordResetToken = await generatePasswordResetToken(email)
    await sendResetPasswordEmail(
      passwordResetToken.email,
      passwordResetToken.token
    )

    return {
      success: 'Ссылка для сброса пароля отправлена на вашу почту!',
    }
  }
}
