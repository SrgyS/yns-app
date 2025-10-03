import { GetCourseService } from '@/entity/course/module'
import { CreatePaymentService } from '@/entity/payment/module'
import { CheckCourseAccessService } from '@/entity/user-access/module'
import { CourseSlug } from '@/kernel/domain/course'
import { UserId } from '@/kernel/domain/user'
import {
  getCourseOrderSucccessPath,
  getCourseOrdereWebhookPath,
} from '@/kernel/lib/router'
import { publicConfig } from '@/shared/config/public'
import { privateConfig } from '@/shared/config/private'
import { TRPCError } from '@trpc/server'
import { injectable } from 'inversify'
import { ProdamusService } from './prodamus'

type Command = {
  courseSlug: CourseSlug
  userId: UserId
  userEmail: string
  urlReturn: string
}

@injectable()
export class StartCourseOrderService {
  constructor(
    private getCourseService: GetCourseService,
    private checkCourseAccessService: CheckCourseAccessService,
    private createPaymentService: CreatePaymentService,
    private prodamusService: ProdamusService
  ) {}
  async exec(command: Command) {
    const course = await this.getCourseService.exec({
      slug: command.courseSlug,
    })

    if (!course) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} not found`,
      })
    }

    if (course.draft) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} in draft`,
      })
    }

    if (course.product.access === 'free') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} is free`,
      })
    }

    if (
      await this.checkCourseAccessService.exec({
        userId: command.userId,
        course: course,
      })
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} is already purchased`,
      })
    }

    const payment = await this.createPaymentService.exec({
      userEmail: command.userEmail,
      userId: command.userId,
      products: [
        {
          type: course.contentType,
          sku: course.id,
          price: course.product.price,
          name: `Доступ к курсу: ${course.title}`,
          quantity: 1,
        },
      ],
    })

    const successPath = getCourseOrderSucccessPath(publicConfig.PUBLIC_URL)
    const notificationPath = getCourseOrdereWebhookPath(publicConfig.PUBLIC_URL)

    const isProdamusConfigured = Boolean(
      privateConfig.PRODAMUS_URL && privateConfig.PRODAMUS_KEY,
    )

    const orderId = `${payment.paymentId}-${payment.products
      .map(product => product.name)
      .join(',')}`

    if (!isProdamusConfigured) {
      // TODO(prod-integr): remove fallback redirect once Prodamus integration is live
      const fallbackUrl = `/order/temp-prodamus-order/${course.slug}?orderId=${encodeURIComponent(
        orderId
      )}&urlReturn=${encodeURIComponent(command.urlReturn)}`
      console.log('PRODAMUS IS NOT CONFIGURED, REDIRECT TO', fallbackUrl)

      return {
        url: fallbackUrl,
      } as const
    }

    const { url } = await this.prodamusService.createLink({
      urlReturn: command.urlReturn,
      urlSuccess: successPath,
      urlNotification: notificationPath,
      ...payment,
    })

    return {
      url,
    } as const
  }
}
