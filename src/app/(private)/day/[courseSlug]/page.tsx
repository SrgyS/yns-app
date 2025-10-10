'use client'

import { CalendarTabs } from '@/features/daily-plan/_ui/calendar-tabs'
import { Button } from '@/shared/ui/button'
import { Suspense, use } from 'react'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { CourseBanner } from '@/features/daily-plan/_ui/course-banner'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { CourseActivationBanner } from '@/features/daily-plan/_ui/course-activation-banner'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import Link from 'next/link'

interface DayPageProps {
  params: Promise<{
    courseSlug: string
  }>
}

export default function DayPage({ params }: DayPageProps) {
  const resolvedParams = use(params)
  const { data: session } = useAppSession()
  const { checkAccessByCourseSlug } = useCourseEnrollment()

  const accessQuery = checkAccessByCourseSlug(
    session?.user?.id || '',
    resolvedParams.courseSlug
  )

  // Проверяем доступ к курсу
  if (accessQuery.isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-[640px] flex-col space-y-6 px-3 py-4 sm:px-4 md:px-6">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-[200px] w-full" />
      </main>
    )
  }

  const {
    hasAccess,
    enrollment,
    activeEnrollment,
    isActive,
    accessExpiresAt,
  } =
    accessQuery.data ?? {
      hasAccess: false,
      enrollment: null,
      activeEnrollment: null,
      isActive: false,
      accessExpiresAt: null,
    }

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
        <CourseBanner
          courseSlug={resolvedParams.courseSlug}
          accessExpiresAt={accessExpiresAt}
        />
      </Suspense>

      {/* Показываем баннер, если курс не активен */}
      {!isActive && activeEnrollment && (
        <CourseActivationBanner
          courseSlug={resolvedParams.courseSlug}
          activeCourseSlug={
            activeEnrollment.course?.slug || 'Активный курс не найден'
          }
          enrollmentId={enrollment.id}
        />
      )}

      <CalendarTabs courseSlug={resolvedParams.courseSlug} />
      {/* <Button variant="outline">Варианты питания</Button> */}
    </main>
  )
}
