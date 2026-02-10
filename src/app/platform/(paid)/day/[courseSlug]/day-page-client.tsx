'use client'

import { CalendarTabs } from '@/features/daily-plan/_ui/calendar-tabs'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { CourseBanner } from '@/features/daily-plan/_ui/course-banner'
import {
  isCourseAccessState,
  useCheckAccessByCourseSlugQuery,
  type CourseAccessState,
} from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { CourseActivationBanner } from '@/features/daily-plan/_ui/course-activation-banner'
import { usePaidAccess } from '@/features/course-enrollment/_vm/paid-access-context'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'
import { CourseSlug } from '@/kernel/domain/course'
import { useRouter } from 'next/navigation'

export function DayPageClient({ courseSlug }: { courseSlug: CourseSlug }) {
  const { data: session } = useAppSession()
  // Removed useCourseEnrollment
  const paidAccess = usePaidAccess()
  const router = useRouter()

  const accessibleEntry = paidAccess?.accessibleCourses.find(
    entry => entry.enrollment.course?.slug === courseSlug
  )

  const hasServerAccess = Boolean(accessibleEntry)

  const accessQuery = useCheckAccessByCourseSlugQuery(
    session?.user?.id || '',
    courseSlug,
    {
      enabled: !hasServerAccess && Boolean(session?.user?.id),
    }
  )

  const shouldShowInitialLoading = !hasServerAccess && accessQuery.isLoading

  let accessData: CourseAccessState | undefined

  if (hasServerAccess) {
    accessData = {
      hasAccess: true,
      enrollment: accessibleEntry?.enrollment ?? null,
      activeEnrollment: paidAccess?.activeEnrollment ?? null,
      isActive: Boolean(accessibleEntry?.enrollment.active),
      accessExpiresAt: accessibleEntry?.accessExpiresAt ?? null,
      setupCompleted: Boolean(accessibleEntry?.setupCompleted),
    } satisfies CourseAccessState
  } else if (isCourseAccessState(accessQuery.data)) {
    accessData = accessQuery.data
  } else {
    accessData = undefined
  }

  const hasAccess = accessData?.hasAccess ?? false
  const enrollment = accessData?.enrollment ?? null
  const activeEnrollment = accessData?.activeEnrollment ?? null
  const isActive = accessData?.isActive ?? false
  const accessExpiresAt = accessData?.accessExpiresAt ?? null
  const setupCompleted = accessData?.setupCompleted ?? false

  const enrollmentCourseId = enrollment?.courseId

  const shouldRedirectToSetup =
    hasAccess && Boolean(enrollmentCourseId) && !setupCompleted

  useEffect(() => {
    if (!shouldRedirectToSetup || !enrollmentCourseId) {
      return
    }

    router.replace(`/platform/select-workout-days/${enrollmentCourseId}`)
  }, [shouldRedirectToSetup, enrollmentCourseId, router])

  if (shouldShowInitialLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (!hasAccess || !enrollment) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 pb-4 sm:px-4 md:px-6">
        <NoAccessCallout
          title="Доступ запрещен"
          description="У вас нет доступа к этому курсу. Приобретите курс, чтобы продолжить."
          ctaHref="/"
          ctaLabel="Купить курс"
        />
      </div>
    )
  }

  if (shouldRedirectToSetup) {
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-[200px] w-full" />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-5 px-3 py-4 sm:space-y-6 sm:px-4 md:px-6">
      <Suspense fallback={<Skeleton className="h-6 w-[300px]" />}>
        <CourseBanner
          courseSlug={courseSlug}
          accessExpiresAt={accessExpiresAt}
        />
      </Suspense>

      {!isActive && activeEnrollment && (
        <CourseActivationBanner
          courseSlug={courseSlug}
          activeCourseSlug={
            activeEnrollment.course?.slug || 'Активный курс не найден'
          }
          enrollmentId={enrollment.id}
        />
      )}

      <CalendarTabs courseSlug={courseSlug} />
    </main>
  )
}
