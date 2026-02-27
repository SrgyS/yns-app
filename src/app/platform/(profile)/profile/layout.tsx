import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'
import { toUserCourseEnrollmentApi } from '@/features/course-enrollment/_lib/map-user-course-enrollment'
import type { PaidAccessState } from '@/features/course-enrollment/_vm/paid-access-types'
import { PaidAccessProviderClient } from '@/features/course-enrollment/_vm/paid-access-provider-client'
import { PaidActivityFlag } from '@/features/activity-tracker/paid-activity-flag'
import { UserFreezeRepository } from '@/entities/user-access/_repository/user-freeze'
import { PlatformHeader } from '@/features/headers/platform-header'
import { MobileBottomNav } from '@/features/navigation/mobile/mobile-bottom-nav'

export default async function PlatformProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const userId = session.user.id

  const getAccessibleEnrollmentsService = server.get(
    GetAccessibleEnrollmentsService
  )
  const userFreezeRepository = server.get(UserFreezeRepository)

  const [activeFreeze, accessibleEnrollments] = await Promise.all([
    userFreezeRepository.findActive(userId),
    getAccessibleEnrollmentsService.exec(userId),
  ])

  const hasAccess = accessibleEnrollments.length > 0 && !activeFreeze

  const activeAccessible = accessibleEnrollments.find(
    entry => entry.enrollment.active
  )

  const accessibleCourses = accessibleEnrollments.map(entry => ({
    enrollment: toUserCourseEnrollmentApi(entry.enrollment),
    accessExpiresAt: entry.accessExpiresAt
      ? entry.accessExpiresAt.toISOString()
      : null,
    accessStartedAt: entry.accessStartedAt.toISOString(),
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
    accessStartedAt: activeAccessible
      ? activeAccessible.accessStartedAt.toISOString()
      : null,
    accessibleCourses,
  }

  return (
    <PaidAccessProviderClient initialState={paidAccessState}>
      <PaidActivityFlag />
      <div className="min-h-screen flex flex-col bg-background">
        <div className="hidden md:block">
          <PlatformHeader />
        </div>
        <main className="flex-1 container pb-17 md:pb-0 px-3 sm:px-6 py-6 overflow-auto">
          {children}
        </main>
        <MobileBottomNav variant="private" />
      </div>
    </PaidAccessProviderClient>
  )
}
