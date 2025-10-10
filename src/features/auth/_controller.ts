import { injectable } from 'inversify'
import { Controller, publicProcedure, router } from '@/kernel/lib/trpc/module'

import { CreateUserService } from '@/kernel/services/create-user'
import {
  emailSignUpSchema,
  newPasswordSchemaWithToken,
  resetPasswordSchema,
} from './schemas'
import { VerificationTokenService } from '@/entities/user/_services/new-verification'
import { z } from 'zod'
import { UserRepository } from '@/entities/user/_repositories/user'
import { dbClient } from '@/shared/lib/db'
import { TRPCError } from '@trpc/server'
import { ResetPasswordService } from '@/entities/user/_services/reset-password'
import { NewPasswordService } from '@/entities/user/_services/new-password'

@injectable()
export class AuthCredentialsController extends Controller {
  constructor(
    private createUserService: CreateUserService,
    private verificationTokenService: VerificationTokenService,
    private userRepository: UserRepository,
    private resetPasswordService: ResetPasswordService,
    private newPasswordService: NewPasswordService
  ) {
    super()
  }
  public router = router({
    auth: router({
      register: publicProcedure
        .input(emailSignUpSchema)
        .mutation(({ input }) => {
          return this.createUserService.exec({
            ...input,
            emailVerified: null,
            role: 'USER',
          })
        }),
      getVerificationToken: publicProcedure
        .input(z.string())
        .query(async ({ input }) => {
          const existingToken = await this.verificationTokenService.exec(input)
          if (!existingToken) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Токен не найден',
            })
          }

          const hasExpired = new Date(existingToken.expires) < new Date()

          if (hasExpired) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Время подтверждения истекло',
            })
          }

          const existingUser = await this.userRepository.findUserByEmail(
            existingToken.email
          )
          if (!existingUser) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Email не найден',
            })
          }

          await dbClient.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          })
          await dbClient.verificationToken.delete({
            where: {
              email_token: {
                email: existingToken.email,
                token: existingToken.token,
              },
            },
          })
          return { success: 'Email успешно подтвержден' }
        }),
      resetPassword: publicProcedure
        .input(resetPasswordSchema)
        .mutation(async ({ input }) => {
          const result = await this.resetPasswordService.exec(input)
          return result
        }),
      newPassword: publicProcedure
        .input(newPasswordSchemaWithToken)
        .mutation(async ({ input }) => {
          const result = await this.newPasswordService.exec(input)
          return result
        }),
    }),
  })
}
