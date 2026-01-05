import { GetCourseService } from '@/entities/course/module'
import { CreatePaymentService } from '@/entities/payment/module'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { CourseSlug, selectDefaultCourseTariff } from '@/kernel/domain/course'
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
  tariffId?: string
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

    const selectedTariff = (() => {
      if (command.tariffId) {
        return (
          course.tariffs.find(tariff => tariff.id === command.tariffId) ?? null
        )
      }

      const paidTariffs = course.tariffs.filter(
        tariff => tariff.access === 'paid' && typeof tariff.price === 'number'
      )

      if (paidTariffs.length === 0) {
        return selectDefaultCourseTariff(course.tariffs)
      }

      return paidTariffs.reduce((min, tariff) =>
        (tariff.price ?? 0) < (min.price ?? 0) ? tariff : min
      )
    })()

    if (!selectedTariff) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} has no tariffs`,
      })
    }

    if (
      await this.checkCourseAccessService.exec({
        userId: command.userId,
        course: {
          id: course.id,
          tariffs: course.tariffs,
          contentType: course.contentType,
        },
      })
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} is already purchased`,
      })
    }

    if (selectedTariff.price <= 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${command.courseSlug} has no price`,
      })
    }

    const payment = await this.createPaymentService.exec({
      userEmail: command.userEmail,
      userId: command.userId,
      products: [
        {
          type: course.contentType,
          sku: `${course.id}:${selectedTariff.id}`,
          price: selectedTariff.price,
          name: `Доступ к курсу: ${course.title}`,
          quantity: 1,
        },
      ],
    })

    const successPath = getCourseOrderSucccessPath(publicConfig.PUBLIC_URL)
    const notificationPath = getCourseOrdereWebhookPath(publicConfig.PUBLIC_URL)

    const isProdamusConfigured = Boolean(
      privateConfig.PRODAMUS_URL && privateConfig.PRODAMUS_KEY
    )

    const orderId = `${payment.paymentId}-${payment.products
      .map(product => product.name)
      .join(',')}`

    if (!isProdamusConfigured) {
      // TODO(prod-integr): remove fallback redirect once Prodamus integration is live
      const fallbackUrl = `/platform/order/temp-prodamus-order/${course.slug}?orderId=${encodeURIComponent(
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
