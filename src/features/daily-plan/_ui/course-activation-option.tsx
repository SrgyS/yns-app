'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

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

  const handleSelect = async () => {
    try {
      await activateEnrollment(enrollmentId)
      router.push(`/day/${courseSlug}`)
    } catch (error) {
      console.error('Ошибка при активации курса:', error)
    }
  }

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
        <Button onClick={handleSelect} disabled={isActivating}>
          Сделать активным
        </Button>
      </CardContent>
    </Card>
  )
}
