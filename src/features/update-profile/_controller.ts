import {
  checkAbilityInputProcedure,
  Controller,
  router,
} from '@/kernel/lib/trpc/module'
import {
  GetProfileService,
  UpdateProfileService,
} from '../../entity/user/module'
import { injectable } from 'inversify'
import { createProfileAbility } from './_domain/ability'
import z from 'zod'
import { profileSchema } from '../../entity/user/client'

const withUseridSchema = z.object({
  userId: z.string(),
})

@injectable()
export class UpdateProfileController extends Controller {
  constructor(
    private updateProfileService: UpdateProfileService,
    private getProfileService: GetProfileService
  ) {
    super()
  }

  public router = router({
    updateProfile: router({
      get: checkAbilityInputProcedure({
        create: createProfileAbility,
        input: withUseridSchema,
        check: (ability, data) => ability.canGetProfile(data.userId),
      })
        .input(withUseridSchema)
        .query(({ input }) => {
          return this.getProfileService.exec(input)
        }),

      update: checkAbilityInputProcedure({
        create: createProfileAbility,
        input: withUseridSchema,
        check: (ability, data) => ability.canUpdateProfile(data.userId),
      })
        .input(
          withUseridSchema.extend({
            data: profileSchema.partial(),
          })
        )
        .mutation(({ input }) => {
          return this.updateProfileService.exec(input)
        }),
    }),
  })
}
