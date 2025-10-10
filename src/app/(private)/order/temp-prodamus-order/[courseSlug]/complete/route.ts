import { NextResponse } from 'next/server'
import { server } from '@/app/server'
import { ReceiveOrderWebhookService } from '@/features/course-order/module'
import { GetPaymentService } from '@/entities/payment/module'
import { ProdamusService } from '@/features/course-order/_services/prodamus'
import { Hmac } from '@/shared/lib/hmac'
import { privateConfig } from '@/shared/config/private'

// TODO(prod-integr): удалить mock-роут после подключения реальной интеграции с Prodamus
export const POST = async (
  req: Request,
  context: { params: Promise<{ courseSlug: string }> }
) => {
  try {
    const { courseSlug } = await context.params
    const { orderId } = (await req.json()) as { orderId?: string }

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    const prodamusService = server.get(ProdamusService)
    const getPaymentService = server.get(GetPaymentService)
    const receiveOrderWebhookService = server.get(ReceiveOrderWebhookService)

    const paymentId = prodamusService.parseOrderId(orderId)

    const payment = await getPaymentService.exec({ paymentId })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    const signature = Hmac.create(
      {
        userId: payment.userId,
        paymentId: payment.paymentId,
      },
      privateConfig.PRODAMUS_KEY ?? ''
    )

    const result = await receiveOrderWebhookService.exec({
      data: {
        _param_user_id: payment.userId,
        _param_payment_id: payment.paymentId,
        _param_sign: signature || '',
      },
    })

    if (result.type === 'error') {
      return NextResponse.json(
        { error: result.message },
        { status: result.code ?? 400 }
      )
    }

    const targetCourseId = payment.products[0]?.sku

    return NextResponse.json({
      message: 'success',
      nextUrl: targetCourseId
        ? `/select-workout-days/${targetCourseId}`
        : `/select-workout-days/${courseSlug}`,
    })
  } catch (error) {
    console.error('Failed to complete mock payment', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
