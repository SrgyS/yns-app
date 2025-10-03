import { Controller } from '@/kernel/lib/trpc/module'
import { ContainerModule } from 'inversify'
import { CourseOrderController } from './_controller'
import { CheckOrderStatusService } from './_services/check-order-status'
import { ReceiveOrderWebhookService } from './_services/receive-order-webhook'
import { StartCourseOrderService } from './_services/start-course-order'
import { ReceiveOrderService } from './_services/receive-order'
import { ProdamusService } from './_services/prodamus'

// import { ProdamusService } from './_services/prodamus'

export const CourseOrderModule = new ContainerModule(context => {
  const { bind } = context

  bind(Controller).to(CourseOrderController)
  bind(CheckOrderStatusService).toSelf()
  bind(StartCourseOrderService).toSelf()
  bind(ReceiveOrderWebhookService).toSelf()
  bind(ReceiveOrderService).toSelf()
  bind(ProdamusService).toSelf()
})

export { ReceiveOrderWebhookService }
