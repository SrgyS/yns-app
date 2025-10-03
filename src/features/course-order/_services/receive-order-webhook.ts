import { DataObject } from '@/shared/lib/hmac'
import { injectable } from 'inversify'
import { ProdamusService } from './prodamus'
import { webhookDataScehama } from '../_domain/schemas'
import { ReceivePaymentService } from '@/entities/payment/module'
import { GrandCourseAccessService } from '@/entities/user-access/module'
import { GetCourseService } from '@/entities/course/module'

type Command = {
  data: DataObject
}

type Result =
  | {
      type: 'error'
      code: number
      message: string
    }
  | {
      type: 'success'
    }

@injectable()
export class ReceiveOrderWebhookService {
  constructor(
    private prodamsusService: ProdamusService,
    private receivePaymentService: ReceivePaymentService,
    private grandAccessService: GrandCourseAccessService,
    private getCourseService: GetCourseService
  ) {}
  async exec(command: Command): Promise<Result> {
    const res = webhookDataScehama.safeParse(command.data)

    if (!res.success) {
      return {
        type: 'error',
        code: 400,
        message: 'Params invalid',
      }
    }

    const { paymentId, userId, sign } = res.data

    if (
      !this.prodamsusService.checkSignature({
        data: {
          userId,
          paymentId,
        },
        sign,
      })
    ) {
      console.log('signature invalid')
      return {
        type: 'error',
        code: 400,
        message: 'Signature invalid',
      }
    }

    const payment = await this.receivePaymentService.exec({
      paymentId,
      userId,
      type: 'success',
    })

    const course = await this.getCourseService.exec({
      id: payment.products[0].sku,
    })
    if (!course) {
      console.error('Course not found while processing payment', {
        paymentId,
        courseId: payment.products[0].sku,
      })
      return {
        type: 'error',
        code: 500,
        message: 'Course not found',
      }
    }
    const expiresAt = (() => {
      if (course.product.access !== 'paid') {
        return null
      }
      if (course.product.accessDurationDays <= 0) {
        return null
      }
      const millisecondsPerDay = 24 * 60 * 60 * 1000
      return new Date(
        Date.now() + course.product.accessDurationDays * millisecondsPerDay
      )
    })()

    await this.grandAccessService.exec({
      courseId: course.id,
      reason: 'paid',
      userId,
      contentType: course.contentType,
      expiresAt,
    })

    return {
      type: 'success',
    }
  }
}
