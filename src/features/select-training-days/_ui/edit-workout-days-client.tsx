'use client'

import { DayOfWeek } from '@prisma/client'
import { useState } from 'react'
import { toast } from 'sonner'
// import { useCurrentDay } from '../_vm/use-current-day'
import { WorkoutDaySelector } from './workout-day-selector'
import { useUpdateWorkoutDays } from '../_vm/use-update-workout-days'
import { useRouter } from 'next/navigation'
import { UserId } from '@/kernel/domain/user'


interface EditWorkoutDaysClientProps {
  userId: UserId
  initialSelectedDays: DayOfWeek[]
  minDays?: number
  maxDays?: number
}

export function EditWorkoutDaysClient({
  userId,
  initialSelectedDays,
  minDays = 5,
  maxDays = 5,
}: EditWorkoutDaysClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { updateWorkoutDays, isUpdating } = useUpdateWorkoutDays()
  // const today = useCurrentDay()

  const handleDaysSelection = async (days: DayOfWeek[]) => {
    setIsSubmitting(true)
    try {
      // Если у пользователя уже есть дни тренировок, значит он редактирует существующую запись
      if (initialSelectedDays.length > 0) {
        // Получаем активную запись и обновляем дни тренировок
        await updateWorkoutDays({
          userId,
          selectedWorkoutDays: days,
        })
        // Тост уже вызывается внутри updateWorkoutDays, поэтому здесь его можно удалить
      } else {
        // Создаем новую запись на курс
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
