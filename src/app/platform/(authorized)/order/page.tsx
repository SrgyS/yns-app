import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { StartCourseOrderService } from '@/features/course-order/module'
import { createCourseOrderSchema } from '@/features/course-order/_domain/schemas'
import { SessionService } from '@/kernel/lib/next-auth/module'

type SearchParams = Record<string, string | string[] | undefined>

export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>
}>) {
  const resolvedSearchParams = await searchParams

  const normalizedSearchParams = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => {
      return [key, Array.isArray(value) ? value[0] : value]
    })
  )

  const parsedSearchParams = createCourseOrderSchema.safeParse(
    normalizedSearchParams
  )

  if (!parsedSearchParams.success) {
    redirect('/')
  }

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const startCourseOrderService = server.get(StartCourseOrderService)

  let result: Awaited<ReturnType<StartCourseOrderService['exec']>>

  try {
    result = await startCourseOrderService.exec({
      courseSlug: parsedSearchParams.data.courseSlug,
      userId: session.user.id,
      userEmail: session.user.email,
      urlReturn: parsedSearchParams.data.urlReturn,
      tariffId: parsedSearchParams.data.tariffId,
    })
  } catch (error) {
    console.error('Failed to start course order', error)
    redirect(parsedSearchParams.data.urlReturn)
  }

  redirect(result.url)
}
