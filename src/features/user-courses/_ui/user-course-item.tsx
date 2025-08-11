'use client'

import { Course } from '@/entity/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import Link from 'next/link'
import { CalendarDays, CheckCircle } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { UserCourseEnrollmentApi } from '@/entity/course/_domain/course'
import React from 'react'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { SmallSpinner } from '@/shared/ui/small-spinner'
import { EditWorkoutDaysField } from './edit-workout-days-field'

interface UserCourseItemProps {
  course: Course
  enrollment: UserCourseEnrollmentApi
}

export function UserCourseItem({ course, enrollment }: UserCourseItemProps) {
  // Используем хук useCourseEnrollment, который уже настроен для автоматического обновления кэша
  const { activateEnrollment, isActivating } = useCourseEnrollment()

  const handleActivate = () => {
    // Вызываем функцию активации из хука, обработка ошибок и успеха уже настроена в хуке
    activateEnrollment(enrollment.id)
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
            <EditWorkoutDaysField enrollment={enrollment}/>
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
          <Button asChild>
            <Link href={`/day/${course.slug}`}>Перейти к тренировкам</Link>
          </Button>
        ) : (
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            variant="secondary"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            <SmallSpinner isLoading={isActivating} /> Сделать активным
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
