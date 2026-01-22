import { injectable } from 'inversify'
import { Controller, publicProcedure, router } from '@/kernel/lib/trpc/module'
import { leadRequestSchema } from './_domain/lead-request-schema'
import { LeadRequestService } from './_services/lead-request-service'

@injectable()
export class LeadRequestController extends Controller {
  constructor(private readonly leadRequestService: LeadRequestService) {
    super()
  }

  public router = router({
    leadRequest: router({
      submit: publicProcedure
        .input(leadRequestSchema)
        .mutation(async ({ input }) => {
          await this.leadRequestService.submit(input)
          return { ok: true }
        }),
    }),
  })
}
