import { injectable } from 'inversify'
import { Controller, publicProcedure, router } from '@/kernel/lib/trpc/server'

import { CreateUserService } from '@/kernel/lib/next-auth/_create-user-service'
import { emailSignUpSchema } from './schemas'
import { VerificationTokenService } from '@/entity/user/_services/new-verification'
import { z } from 'zod'
import { UserRepository } from '@/entity/user/_repositories/user'
import { dbClient } from '@/shared/lib/db'
import { TRPCError } from '@trpc/server'

@injectable()
export class AuthCredentialsController extends Controller {
  constructor(
    private createUserService: CreateUserService,
    private verificationTokenService: VerificationTokenService,
    private userReository: UserRepository
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
          const existingToken =
            await this.verificationTokenService.getVerificationToken(input)
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

          const existingUser = await this.userReository.findUserByEmail(
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
    }),
  })
}
