import { DataObject } from '@/shared/lib/hmac'
import { injectable } from 'inversify'
import { ProdamusService } from './prodamus'
import { webhookDataScehama } from '../_domain/schemas'
import { ReceivePaymentService } from '@/entities/payment/module'
import { GrandCourseAccessService } from '@/entities/user-access/module'
import { GetCourseService } from '@/entities/course/module'
import { addDays } from 'date-fns'
import { selectDefaultCourseTariff } from '@/kernel/domain/course'

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

    const [courseId, tariffId] = payment.products[0].sku.split(':')
    const course = await this.getCourseService.exec({
      id: courseId,
    })
    if (!course) {
      console.error('Course not found while processing payment', {
        paymentId,
        courseId,
      })
      return {
        type: 'error',
        code: 500,
        message: 'Course not found',
      }
    }

    const tariff =
      (tariffId
        ? course.tariffs.find(entry => entry.id === tariffId)
        : null) ?? selectDefaultCourseTariff(course.tariffs)
    const expiresAt = (() => {
      if (tariff?.access !== 'paid') {
        return null
      }
      if (!tariff.durationDays || tariff.durationDays <= 0) {
        return null
      }
      return addDays(new Date(), tariff.durationDays)
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
