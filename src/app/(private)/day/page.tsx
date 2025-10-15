import { redirect } from 'next/navigation'
import Link from 'next/link'

import { server } from '@/app/server'
import { ContextFactory } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from '@/features/course-enrollment/_controller'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { createControllerHelpers } from '@/shared/api/server-helpers'

export default async function DayPage() {
  const contextFactory = server.get(ContextFactory)
  const ctx = await contextFactory.createContext()

  const session = ctx.session

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const userId = session.user.id

  const { helpers } = createControllerHelpers({
    container: server,
    controller: CourseEnrollmentController,
    ctx,
  })

  type UserEnrollmentsResult = Awaited<
    ReturnType<typeof helpers.course.getUserEnrollments.fetch>
  >

  let enrollments:
    | Awaited<
        ReturnType<
          typeof helpers.course.getUserEnrollments.fetch
        >
      >
    | null = null

  let activeEnrollment:
    | Awaited<
        ReturnType<
          typeof helpers.course.getActiveEnrollment.fetch
        >
      >
    | null = null

  try {
    ;[activeEnrollment, enrollments] = await Promise.all([
      helpers.course.getActiveEnrollment.fetch({
        userId,
      }),
      helpers.course.getUserEnrollments.fetch({
        userId,
      }),
    ])
  } catch (error) {
    console.error('Failed to load enrollments for day page', error)
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            Не удалось загрузить данные о ваших курсах. Пожалуйста,
            попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  if (activeEnrollment?.course?.slug) {
    redirect(`/day/${activeEnrollment.course.slug}`)
  }

  const hasEnrollments = Array.isArray(enrollments) && enrollments.length > 0

  if (enrollments && hasEnrollments) {
    const enrollmentList = enrollments

    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Alert>
          <AlertTitle>Выберите активный курс</AlertTitle>
          <AlertDescription>
            У вас есть несколько курсов. Выберите один из них, чтобы начать
            тренировки.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {enrollmentList.map((enrollment: UserEnrollmentsResult[number]) => {
            const slug = enrollment.course?.slug
            const title = enrollment.course?.title || 'Курс без названия'

            if (!slug) {
              return null
            }

            return (
              <Button
                key={enrollment.id}
                variant="outline"
                className="justify-start"
                asChild
              >
                <Link href={`/day/${slug}`}>{title}</Link>
              </Button>
            )
          })}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
      <Alert>
        <AlertTitle>У вас нет активных курсов</AlertTitle>
        <AlertDescription>
          Приобретите курс, чтобы начать тренировки.
        </AlertDescription>
      </Alert>
      <Button asChild>
        <Link href="/">Выбрать курс</Link>
      </Button>
    </main>
  )
}
