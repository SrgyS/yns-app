import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { ActivateEnrollmentService } from '@/entities/course/module'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'
import { CourseActivationOption } from '@/features/daily-plan/_ui/course-activation-option'
import { logger } from '@/shared/lib/logger'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'

export default async function CourseAccessGatePage() {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const userId = session.user.id

  const getAccessibleEnrollmentsService = server.get(
    GetAccessibleEnrollmentsService
  )
  const accessibleEnrollments =
    await getAccessibleEnrollmentsService.exec(userId)

  if (accessibleEnrollments.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <NoAccessCallout
          title="У вас нет доступных курсов"
          description="Оформите подписку или приобретите курс, чтобы получить доступ к плану тренировок."
          ctaHref="/"
          ctaLabel="Выбрать курс или оформить подписку"
        />
      </main>
    )
  }

  const activeEnrollment = accessibleEnrollments.find(
    entry => entry.enrollment.active && entry.course.slug
  )

  if (activeEnrollment?.course.slug) {
    redirect(`/platform/day/${activeEnrollment.course.slug}`)
  }

  if (accessibleEnrollments.length === 1) {
    const [single] = accessibleEnrollments
    const courseSlug = single.course.slug
    if (courseSlug) {
      let shouldRedirect = true
      if (!single.enrollment.active) {
        const activateEnrollmentService = server.get(ActivateEnrollmentService)
        try {
          await activateEnrollmentService.exec(single.enrollment.id)
        } catch (error) {
          logger.error({
            msg: '[CourseAccessGatePage] Failed to activate single accessible enrollment',
            enrollmentId: single.enrollment.id,
            error,
          })
          shouldRedirect = false
        }
      }
      if (shouldRedirect) {
        redirect(`/platform/day/${courseSlug}`)
      }
    }
  }

  const selectableCourses = accessibleEnrollments
    .filter(entry => entry.course.slug)
    .map(entry => ({
      enrollmentId: entry.enrollment.id,
      courseSlug: entry.course.slug!,
      courseTitle: entry.course.title,
      accessExpiresAt: entry.accessExpiresAt
        ? entry.accessExpiresAt.toISOString()
        : null,
    }))

  if (selectableCourses.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Alert>
          <AlertTitle>Курсы недоступны</AlertTitle>
          <AlertDescription>
            Попробуйте обновить страницу или обратитесь в поддержку.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
      <Alert>
        <AlertTitle>Выберите курс для продолжения</AlertTitle>
        <AlertDescription>
          У вас есть несколько курсов с действующим доступом. Сделайте один из
          них активным, чтобы продолжить программу.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {selectableCourses.map(course => (
          <CourseActivationOption
            key={course.enrollmentId}
            courseSlug={course.courseSlug}
            courseTitle={course.courseTitle}
            enrollmentId={course.enrollmentId}
            accessExpiresAt={course.accessExpiresAt}
          />
        ))}
      </div>
    </main>
  )
}
