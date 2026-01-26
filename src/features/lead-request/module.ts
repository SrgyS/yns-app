import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { LeadRequestController } from './_controller'
import {
  LeadRequestRateLimiter,
  LeadRequestService,
} from './_services/lead-request-service'

export const LeadRequestModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(LeadRequestController)
  bind(LeadRequestService).toSelf()
  bind(LeadRequestRateLimiter).toSelf().inSingletonScope()
})

export { LeadRequestController } from './_controller'
