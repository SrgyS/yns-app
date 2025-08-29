import { Controller } from '@/kernel/lib/trpc/module'
import { ContainerModule } from 'inversify'
import { CoursePurchaseController } from './_controller'
import { CheckPurchaseStatusService } from './_services/check-purchase-status'
import { ReceivePurchaseWebhookService } from './_services/receive-purchase-webhook'
import { CreatePurchaseService } from './_services/create-purchase'
import { ReceivePurchaseService } from './_services/receive-purchase'

// import { ProdamusService } from './_services/prodamus'

export const CoursePurchaseModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(CoursePurchaseController)
  bind(CheckPurchaseStatusService).toSelf()
  bind(CreatePurchaseService).toSelf()
  bind(ReceivePurchaseWebhookService).toSelf()
  bind(ReceivePurchaseService).toSelf()
//   bind(ProdamusService).toSelf()
})

export { ReceivePurchaseWebhookService }
