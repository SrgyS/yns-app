'use client'

import { Course, UserCourseEnrollmentApi } from '@/entities/course'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { CalendarDays, CheckCircle, Snowflake } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import React from 'react'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { SmallSpinner } from '@/shared/ui/small-spinner'
import { EditWorkoutDaysField } from './edit-workout-days-field'
import { courseEnrollmentApi } from '@/features/course-enrollment/_api'
import { workoutApi } from '@/features/daily-plan/_api'
import { useRouter } from 'next/navigation'

interface UserCourseItemProps {
  course: Course
  enrollment: UserCourseEnrollmentApi
  freezeUntil: string | null
  accessExpiresAt: string | null
  accessStartedAt: string
}

export function UserCourseItem({
  course,
  enrollment,
  freezeUntil,
  accessExpiresAt,
  accessStartedAt,
}: Readonly<UserCourseItemProps>) {
  // Используем хук useCourseEnrollment, который уже настроен для автоматического обновления кэша
  const { activateEnrollment, isActivating } = useCourseEnrollment()
  const courseEnrollmentUtils = courseEnrollmentApi.useUtils()
  const workoutUtils = workoutApi.useUtils()
  const router = useRouter()

  const handleActivate = async () => {
    if (freezeUntil) {
      return
    }
    try {
      await activateEnrollment(enrollment.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to activate course', error)
    }
  }

  // Обработчик для перехода к тренировкам с инвалидацией кеша
  const handleGoToWorkouts = async (e: React.MouseEvent) => {
    if (freezeUntil) {
      e.preventDefault()
      return
    }
    e.preventDefault()

    // Инвалидируем конкретные запросы вместо всего кеша
    await courseEnrollmentUtils.course.getEnrollmentByCourseSlug.invalidate()
    await workoutUtils.getUserDailyPlan.invalidate()
    await courseEnrollmentUtils.course.getEnrollment.invalidate()

    // Переходим на страницу тренировок
    router.push(`/day/${course.slug}`)
  }

  const startDateFormatted = format(
    new Date(accessStartedAt ?? enrollment.startDate),
    'dd MMMM yyyy',
    { locale: ru }
  )
  const endDateFormatted = accessExpiresAt
    ? format(new Date(accessExpiresAt), 'dd MMMM yyyy', { locale: ru })
    : null

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{course.title}</CardTitle>
          {freezeUntil && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 gap-1 w-fit"
            >
              <Snowflake className="h-3 w-3" />
              {`заморожен до ${format(new Date(freezeUntil), 'dd.MM.yyyy', {
                locale: ru,
              })}`}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays size={16} />
          <span>
            Доступ: с {startDateFormatted}{' '}
            {endDateFormatted ? `по ${endDateFormatted}` : 'бессрочно'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            {enrollment.hasFeedback && (
              <Badge variant="outline" className="bg-green-50">
                С обратной связью
              </Badge>
            )}
            <EditWorkoutDaysField
              enrollment={enrollment}
              freezeUntil={freezeUntil}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {enrollment.active ? (
          <Button onClick={handleGoToWorkouts} disabled={!!freezeUntil}>
            Перейти к тренировкам
          </Button>
        ) : (
          <Button
            onClick={handleActivate}
            disabled={isActivating || !!freezeUntil}
            variant="secondary"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            <SmallSpinner isLoading={isActivating} /> Сделать курсом по
            умолчанию
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
