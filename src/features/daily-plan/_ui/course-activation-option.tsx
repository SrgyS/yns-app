'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { startNavigationFeedback } from '@/shared/lib/navigation/navigation-feedback'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { SmallSpinner } from '@/shared/ui/small-spinner'

type CourseActivationOptionProps = {
  courseSlug: string
  courseTitle: string
  enrollmentId: string
  accessExpiresAt: string | null
}

export function CourseActivationOption({
  courseSlug,
  courseTitle,
  enrollmentId,
  accessExpiresAt,
}: CourseActivationOptionProps) {
  const router = useRouter()
  const { activateEnrollment, isActivating } = useCourseEnrollment()
  const [isNavigationPending, startNavigationTransition] = useTransition()

  const expiresAtLabel = useMemo(() => {
    if (!accessExpiresAt) {
      return null
    }
    const date = new Date(accessExpiresAt)
    if (Number.isNaN(date.getTime())) {
      return null
    }
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }, [accessExpiresAt])

  const handleSelect = () => {
    startNavigationTransition(async () => {
      try {
        await activateEnrollment(enrollmentId)
        startNavigationFeedback()
        router.push(`/platform/day/${courseSlug}`)
      } catch (error) {
        console.error('Ошибка при активации курса:', error)
      }
    })
  }

  const isPending = isActivating || isNavigationPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{courseTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {expiresAtLabel && (
          <p className="text-sm text-muted-foreground">
            Доступ действует до {expiresAtLabel}
          </p>
        )}
        <Button onClick={handleSelect} disabled={isPending}>
          <SmallSpinner isLoading={isPending} />
          Сделать активным
        </Button>
      </CardContent>
    </Card>
  )
}
