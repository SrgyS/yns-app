'use client'

import { DayOfWeek } from '@prisma/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { WorkoutDaySelector } from './workout-day-selector'
import { useUpdateWorkoutDays } from '../_vm/use-update-workout-days'
import { useRouter } from 'next/navigation'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { useWorkoutCompletionStore } from '@/shared/store/workout-completion-store'
import { workoutApi } from '@/features/daily-plan/_api'
import { courseEnrollmentApi } from '@/features/course-enrollment/_api'

interface EditWorkoutDaysClientProps {
  enrollmentId: string
  initialSelectedDays: DayOfWeek[]
  minDays?: number
  maxDays?: number
}

export function EditWorkoutDaysClient({
  enrollmentId,
  initialSelectedDays,
  minDays,
  maxDays,
}: EditWorkoutDaysClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keepProgress, setKeepProgress] = useState(false)
  const router = useRouter()
  const { updateWorkoutDays, isUpdating } = useUpdateWorkoutDays()
  const { data: session } = useAppSession()
  const workoutUtils = workoutApi.useUtils()
  const courseEnrollmentUtils = courseEnrollmentApi.useUtils()

  const userId = session?.user?.id
  if (!userId) {
    return null
  }

  const handleDaysSelection = async (days: DayOfWeek[]) => {
    setIsSubmitting(true)
    try {
      if (initialSelectedDays.length > 0) {
        await updateWorkoutDays({
          enrollmentId,
          selectedWorkoutDays: days,
          keepProgress, // Передаем флаг
        })
        
        // Инвалидируем весь кеш статусов выполнения тренировок
        await workoutUtils.getWorkoutCompletionStatus.invalidate()
        
        // Инвалидируем кеш для getUserDailyPlan и getEnrollment
        await courseEnrollmentUtils.course.getUserDailyPlan.invalidate()
        await courseEnrollmentUtils.course.getEnrollment.invalidate()
        // Добавляем инвалидацию getEnrollmentByCourseSlug
        await courseEnrollmentUtils.course.getEnrollmentByCourseSlug.invalidate()
        
        // Если не сохраняем прогресс, очищаем стор
        if (!keepProgress) {
          // Очищаем стор с отметками о выполнении тренировок
          useWorkoutCompletionStore.setState({ completions: {} })
        } else {
          // Если сохраняем прогресс, всё равно очищаем стор, 
          // чтобы данные загрузились заново с новыми userDailyPlanId
          useWorkoutCompletionStore.setState({ completions: {} })
        }
      } else {
        console.error('ошибка при обновлении дней тренировок')
        toast.error('Не удалось обновить дни тренировок!')
      }

      router.push(`/profile/${userId}`)
    } catch (error) {
      console.error('Error handling workout days:', error)
      toast.error('Произошла ошибка при сохранении дней тренировок')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card">
      <h2 className="text-xl font-semibold text-center">
        Изменить дни тренировок
      </h2>
      <p className="text-sm text-muted-foreground text-center">
        Выберите {minDays} дней в неделю для ваших тренировок. Изменения
        применятся только к будущим дням.
      </p>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="keepProgress"
          checked={keepProgress}
          onCheckedChange={(checked) => setKeepProgress(checked === true)}
        />
        <Label htmlFor="keepProgress" className="text-sm">
          Сохранить прогресс выполненных тренировок
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Если отметить эту опцию, статусы выполненных тренировок будут перенесены 
        в новое расписание. В противном случае все тренировки будут отмечены как невыполненные.
      </p>

      <WorkoutDaySelector
        onSelectDays={handleDaysSelection}
        minDays={minDays}
        maxDays={maxDays}
        initialSelectedDays={initialSelectedDays}
        isLoading={isSubmitting || isUpdating}
      />
    </div>
  )
}
