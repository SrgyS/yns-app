'use client'

import { CalendarTabs } from '@/features/daily-plan/_ui/calendar-tabs'
import { Button } from '@/shared/ui/button'
import { Suspense, use } from 'react'
import { Skeleton } from '@/shared/ui/skeleton'
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
  const { getEnrollmentByCourseSlug, getActiveEnrollment } =
    useCourseEnrollment()

  // Получаем запись на курс по slug
  const enrollmentQuery = getEnrollmentByCourseSlug(
    session?.user?.id || '',
    resolvedParams.courseSlug
  )

  // Получаем активную запись на курс
  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')

  const enrollment = enrollmentQuery.data
  const activeEnrollment = activeEnrollmentQuery.data

  // Проверяем доступ к курсу
  if (enrollmentQuery.isLoading) {
    return (
      <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-[200px] w-full" />
      </main>
    )
  }

  // Если у пользователя нет доступа к курсу
  if (!enrollment) {
    return (
      <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
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

  // Проверяем, является ли текущий курс активным
  const isActive = activeEnrollment?.courseId === enrollment.courseId

  return (
    <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
      <Suspense fallback={<Skeleton className="h-6 w-[300px]" />}>
        <CourseBanner courseSlug={resolvedParams.courseSlug} />
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
      <Button variant="outline">Варианты питания</Button>
    </main>
  )
}
