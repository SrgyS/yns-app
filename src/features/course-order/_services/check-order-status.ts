import { GetCourseService } from '@/entities/course/module'
import { GetPaymentService } from '@/entities/payment/module'
import { UserId } from '@/kernel/domain/user'
import { injectable } from 'inversify'
import { ProdamusService } from './prodamus'
import { TRPCError } from '@trpc/server'

type Query = {
  orderId: string
  userId: UserId
}

@injectable()
export class CheckOrderStatusService {
  constructor(
    private prodamusService: ProdamusService,
    private getCourseService: GetCourseService,
    private getPaymentService: GetPaymentService
  ) {}
  async exec(query: Query) {
    const paymentId = this.prodamusService.parseOrderId(query.orderId)

    const payment = await this.getPaymentService.exec({
      paymentId,
    })

    if (!payment) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Payment not found',
      })
    }

    const [courseId] = payment.products[0].sku.split(':')

    return {
      state: payment.state,
      courseSlug: await this.getCourseService
        .exec({ id: courseId })
        .then(course => course?.slug),
    }
  }
}
