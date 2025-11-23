import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import type { PaidAccessState } from '@/features/course-enrollment/_vm/paid-access-types'
import { PaidAccessProviderClient } from '@/features/course-enrollment/_vm/paid-access-provider-client'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'
import { toUserCourseEnrollmentApi } from '@/features/course-enrollment/_lib/map-user-course-enrollment'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'
import { PaidActivityFlag } from '@/features/activity-tracker/paid-activity-flag'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const hasAccess = accessibleEnrollments.length > 0

  const activeAccessible = accessibleEnrollments.find(
    entry => entry.enrollment.active
  )

  const accessibleCourses = accessibleEnrollments.map(entry => ({
    enrollment: toUserCourseEnrollmentApi(entry.enrollment),
    accessExpiresAt: entry.accessExpiresAt
      ? entry.accessExpiresAt.toISOString()
      : null,
    setupCompleted: entry.setupCompleted,
  }))

  const paidAccessState: PaidAccessState = {
    hasAccess,
    activeEnrollment: activeAccessible
      ? toUserCourseEnrollmentApi(activeAccessible.enrollment)
      : null,
    activeCourseSlug: activeAccessible?.course.slug ?? null,
    accessExpiresAt: activeAccessible?.accessExpiresAt
      ? activeAccessible.accessExpiresAt.toISOString()
      : null,
    accessibleCourses,
  }

  if (!hasAccess) {
    return (
      <PaidAccessProviderClient initialState={paidAccessState}>
        <PaidActivityFlag />
        <div className="pb-[72px] flex flex-col grow">
          <div className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
            <NoAccessCallout
              title="У вас нет купленных курсов"
              description="Оформите подписку или приобретите курс, чтобы получить доступ к платному контенту."
              ctaLabel="Выбрать курс или оформить подписку"
              ctaHref="/"
            />
          </div>
        </div>
      </PaidAccessProviderClient>
    )
  }

  return (
    <PaidAccessProviderClient initialState={paidAccessState}>
      <PaidActivityFlag />
      <div className="pb-[72px] flex flex-col grow">{children}</div>
    </PaidAccessProviderClient>
  )
}
