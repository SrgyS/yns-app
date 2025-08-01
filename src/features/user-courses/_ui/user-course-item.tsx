'use client'

import { Course } from '@/entity/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import Link from 'next/link'
import { CalendarDays, Edit } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { UserCourseEnrollmentApi } from '@/entity/course/_domain/course'

interface UserCourseItemProps {
  course: Course
  enrollment: UserCourseEnrollmentApi
}

export function UserCourseItem({ course, enrollment }: UserCourseItemProps) {
  // Форматируем дни недели для отображения
  const formatWorkoutDays = (days: string[]) => {
    const dayNames: Record<string, string> = {
      'MONDAY': 'Пн',
      'TUESDAY': 'Вт',
      'WEDNESDAY': 'Ср',
      'THURSDAY': 'Чт',
      'FRIDAY': 'Пт',
      'SATURDAY': 'Сб',
      'SUNDAY': 'Вс'
    }
    
    return days.map(day => dayNames[day] || day).join(', ')
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
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Дни тренировок:</h4>
              <div className="flex flex-wrap gap-2">
                {formatWorkoutDays(enrollment.selectedWorkoutDays)}
              </div>
            </div>
            
            {enrollment.hasFeedback && (
              <Badge variant="outline" className="bg-green-50">
                С обратной связью
              </Badge>
            )}
          </div>
          
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/edit-workout-days/${enrollment.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Изменить дни
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/day/${course.slug}`}>Перейти к тренировкам</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}