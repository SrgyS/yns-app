'use client'

import { DayOfWeek } from '@prisma/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { WorkoutDaySelector } from './workout-day-selector'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { CourseId, CourseSlug } from '@/kernel/domain/course'

interface SelectWorkoutDaysClientProps {
  initialSelectedDays: DayOfWeek[]
  minDays?: number
  maxDays?: number
  courseId: CourseId
  courseSlug: CourseSlug
}

export function SelectWorkoutDaysClient({
  courseSlug,
  courseId,
  initialSelectedDays,
  minDays = 5,
  maxDays = 5,
}: SelectWorkoutDaysClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { createEnrollment } = useCourseEnrollment()

  const handleDaysSelection = async (days: DayOfWeek[]) => {
    setIsSubmitting(true)
    try {
      // Создаем новую запись на курс
      await createEnrollment({
        courseId,
        selectedWorkoutDays: days,
        startDate: new Date(),
      })
      setIsSubmitting(false)
      toast.success('План тренировок готов!')
      router.push(`/day/${courseSlug}`)
    } catch (error) {
      console.error('Error handling workout days:', error)
      // Проверяем, есть ли сообщение об ошибке
      const errorMessage = error instanceof Error ? error.message : 'Не удалось создать запись на курс!'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">
        Выберите дни тренировок
      </h2>
      <p className="text-sm text-muted-foreground text-center">
        Пожалуйста, выберите {minDays} дней в неделю для ваших тренировок.
      </p>
      <WorkoutDaySelector
        onSelectDays={handleDaysSelection}
        minDays={minDays}
        maxDays={maxDays}
        initialSelectedDays={initialSelectedDays}
        isLoading={isSubmitting }
      />
    </div>
  )
}
