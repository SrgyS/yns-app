'use client'

import { DayOfWeek } from '@prisma/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { WorkoutDaySelector } from './workout-day-selector'
import { useUpdateWorkoutDays } from '../_vm/use-update-workout-days'
import { useRouter } from 'next/navigation'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCompletionStore } from '@/shared/store/workout-completion-store'
import { workoutApi } from '@/features/daily-plan/_api'
import { courseEnrollmentApi } from '@/features/course-enrollment/_api'
import { WorkoutProgressDialog } from './workout-progress-dialog'

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
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
    setSelectedDays(days)
    setIsDialogOpen(true)
  }

  const handleSaveWithProgress = async () => {
    await saveWorkoutDays(true)
  }

  const handleSaveWithoutProgress = async () => {
    await saveWorkoutDays(false)
  }

  const saveWorkoutDays = async (keepProgress: boolean) => {
    setIsSubmitting(true)
    try {
      if (selectedDays.length > 0) {
        await updateWorkoutDays({
          enrollmentId,
          selectedWorkoutDays: selectedDays,
          keepProgress,
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
      setIsDialogOpen(false)
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
      
      <WorkoutDaySelector
        onSelectDays={handleDaysSelection}
        minDays={minDays}
        maxDays={maxDays}
        initialSelectedDays={initialSelectedDays}
        isLoading={isSubmitting || isUpdating}
      />

      <WorkoutProgressDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveWithProgress={handleSaveWithProgress}
        onSaveWithoutProgress={handleSaveWithoutProgress}
        isLoading={isSubmitting || isUpdating}
      />
    </div>
  )
}
