'use client'

import { CalendarTabs } from '@/features/daily-plan/_ui/calendar-tabs'
import { Button } from '@/shared/ui/button'
import { Suspense } from 'react'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { CourseBanner } from '@/features/daily-plan/_ui/course-banner'
import {
  isCourseAccessState,
  useCourseEnrollment,
  type CourseAccessState,
} from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { CourseActivationBanner } from '@/features/daily-plan/_ui/course-activation-banner'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import Link from 'next/link'
import { usePaidAccess } from '@/features/course-enrollment/_vm/paid-access-context'

interface DayPageClientProps {
  courseSlug: string
}

export function DayPageClient({ courseSlug }: DayPageClientProps) {
  const { data: session } = useAppSession()
  const { checkAccessByCourseSlug } = useCourseEnrollment()
  const paidAccess = usePaidAccess()

  const accessibleEntry = paidAccess?.accessibleCourses.find(
    entry => entry.enrollment.course?.slug === courseSlug
  )

  const hasServerAccess = Boolean(accessibleEntry)

  const accessQuery = checkAccessByCourseSlug(
    session?.user?.id || '',
    courseSlug,
    {
      enabled: !hasServerAccess && Boolean(session?.user?.id),
    }
  )

  if (!hasServerAccess && accessQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-[200px] w-full" />
      </main>
    )
  }

  const accessData = hasServerAccess
    ? ({
        hasAccess: true,
        enrollment: accessibleEntry?.enrollment ?? null,
        activeEnrollment: paidAccess?.activeEnrollment ?? null,
        isActive: Boolean(accessibleEntry?.enrollment.active),
        accessExpiresAt: accessibleEntry?.accessExpiresAt ?? null,
      } satisfies CourseAccessState)
    : isCourseAccessState(accessQuery.data)
      ? accessQuery.data
      : undefined

  const hasAccess = accessData?.hasAccess ?? false
  const enrollment = accessData?.enrollment ?? null
  const activeEnrollment = accessData?.activeEnrollment ?? null
  const isActive = accessData?.isActive ?? false
  const accessExpiresAt = accessData?.accessExpiresAt ?? null

  if (!hasAccess || !enrollment) {
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Alert variant="destructive">
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            У вас нет доступа к этому курсу. Приобретите курс, чтобы получить
            доступ.
          </AlertDescription>
        </Alert>
        <Button>
          <Link href={'/'}>Купить курс</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-5 px-3 py-4 sm:space-y-6 sm:px-4 md:px-6">
      <Suspense fallback={<Skeleton className="h-6 w-[300px]" />}>
        <CourseBanner courseSlug={courseSlug} accessExpiresAt={accessExpiresAt} />
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
