import { server } from '@/app/server'
import { GetCourseService } from '@/entities/course/module'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { CourseSlug } from '@/kernel/domain/course'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MockPaymentButton } from './mock-payment-button'

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

// TODO(prod-integr): delete temporary UI when Prodamus payment page is connected

type SearchParams = {
  orderId?: string | string[]
  urlReturn?: string | string[]
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: CourseSlug }>
  searchParams: Promise<SearchParams>
}) {
  const [resolvedParams, resolvedSearchParams, sessionService, courseService] =
    await Promise.all([
      params,
      searchParams,
      Promise.resolve(server.get(SessionService)),
      Promise.resolve(server.get(GetCourseService)),
    ])

  const courseSlug = resolvedParams.courseSlug

  const orderIdRaw = Array.isArray(resolvedSearchParams.orderId)
    ? resolvedSearchParams.orderId[0]
    : resolvedSearchParams.orderId
  const urlReturnRaw = Array.isArray(resolvedSearchParams.urlReturn)
    ? resolvedSearchParams.urlReturn[0]
    : resolvedSearchParams.urlReturn

  const orderId = orderIdRaw ? decodeURIComponent(orderIdRaw) : null

  if (!orderId) {
    redirect(`/order?courseSlug=${courseSlug}`)
  }

  const urlReturn = (() => {
    if (!urlReturnRaw) {
      return undefined
    }
    try {
      return decodeURIComponent(urlReturnRaw)
    } catch (error) {
      console.error('Error decoding urlReturn', error)
      return urlReturnRaw
    }
  })()

  const session = await sessionService.get()

  if (!session) {
    const headersList = await headers()
    const proto = headersList.get('x-forwarded-proto') ?? 'https'
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const pathname = headersList.get('x-pathname') ?? '/order'
    const currentUrl = host ? new URL(`${proto}://${host}${pathname}`) : null

    redirect(`/auth/sign-in?callbackUrl=${currentUrl}`)
  }

  const course = await courseService.exec({ slug: courseSlug })

  if (!course) {
    redirect('/')
  }

  const userName = session.user?.name ?? 'Без имени'
  const userEmail = session.user?.email ?? '—'
  const coursePrice =
    course.product.access === 'paid'
      ? CURRENCY_FORMATTER.format(course.product.price)
      : 'Бесплатный курс'

  if (course.product.access !== 'paid') {
    redirect(`/day/${courseSlug}`)
  }

  return (
    <main className="max-w-3xl space-y-8 py-12">
      <Card className="space-y-6">
        <CardHeader>
          <CardTitle>Оплата заказа</CardTitle>
          <CardDescription>
            Временная страница для разработки интеграции с Prodamus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Курс</h2>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-medium">{course.title}</p>
                  <p className="text-muted-foreground text-sm">{courseSlug}</p>
                </div>
                <span className="text-base font-semibold">{coursePrice}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Покупатель</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs uppercase text-muted-foreground">Имя</p>
                <p className="text-base font-medium">{userName}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs uppercase text-muted-foreground">Email</p>
                <p className="text-base font-medium">{userEmail}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Оплата</h2>
            <p className="text-muted-foreground text-sm">
              Здесь появится интеграция с платёжным сервисом Prodamus. Пока
              можно использовать кнопку ниже для отладки пользовательского
              сценария.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* TODO(prod-integr): заменить на реальную платёжную кнопку после интеграции с Prodamus 
                     <Button className="w-full sm:w-auto" size="lg" asChild>
                <Link href={successHref}>Оплатить</Link>
              </Button>*/}
              <MockPaymentButton
                courseId={course.id}
                courseSlug={courseSlug}
                orderId={orderId}
              />
              {urlReturn ? (
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <Link href={urlReturn}>Отменить и вернуться</Link>
                </Button>
              ) : null}
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
