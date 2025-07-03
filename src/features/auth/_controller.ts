import { injectable } from 'inversify'
import {
  Controller,
  publicProcedure,
  router,
} from '@/kernel/lib/trpc/server'

import { CreateUserService } from '@/kernel/lib/next-auth/_create-user-service'
import { emailSignUpSchema } from './schemas'


@injectable()
export class AuthCredentialsController extends Controller {
  constructor(
    private createUserService: CreateUserService,
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
    }),
  })
}