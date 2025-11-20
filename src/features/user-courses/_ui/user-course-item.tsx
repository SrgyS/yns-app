'use client'

import { Course } from '@/entities/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { CalendarDays, CheckCircle } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { UserCourseEnrollmentApi } from '@/entities/course'
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
}

export function UserCourseItem({ course, enrollment }: UserCourseItemProps) {
  // Используем хук useCourseEnrollment, который уже настроен для автоматического обновления кэша
  const { activateEnrollment, isActivating } = useCourseEnrollment()
  const courseEnrollmentUtils = courseEnrollmentApi.useUtils()
  const workoutUtils = workoutApi.useUtils()
  const router = useRouter()

  const handleActivate = async () => {
    try {
      await activateEnrollment(enrollment.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to activate course', error)
    }
  }

  // Обработчик для перехода к тренировкам с инвалидацией кеша
  const handleGoToWorkouts = async (e: React.MouseEvent) => {
    e.preventDefault()

    // Инвалидируем конкретные запросы вместо всего кеша
    await courseEnrollmentUtils.course.getEnrollmentByCourseSlug.invalidate()
    await workoutUtils.getUserDailyPlan.invalidate()
    await courseEnrollmentUtils.course.getEnrollment.invalidate()

    // Переходим на страницу тренировок
    router.push(`/day/${course.slug}`)
  }

  const startDateFormatted = format(
    new Date(enrollment.startDate),
    'dd MMMM yyyy',
    { locale: ru }
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays size={16} />
          <span>Начало: {startDateFormatted}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <MdxCode code={course.description} />

            {enrollment.hasFeedback && (
              <Badge variant="outline" className="bg-green-50">
                С обратной связью
              </Badge>
            )}
            <EditWorkoutDaysField enrollment={enrollment} />
            {/* Добавляем информацию о днях тренировок */}
            {/* {enrollment.selectedWorkoutDays && enrollment.selectedWorkoutDays.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Дни тренировок:</h3>
                  <Separator />
                </div>
                <div className="text-sm">
                  {formatWorkoutDays(enrollment.selectedWorkoutDays)}
                </div>
                {enrollment.active && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/edit-workout-days/${enrollment.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Изменить дни
                    </Link>
                  </Button>
                )}
              </div>
            )} */}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {enrollment.active ? (
          <Button onClick={handleGoToWorkouts}>Перейти к тренировкам</Button>
        ) : (
          <Button
            onClick={handleActivate}
            disabled={isActivating}
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
