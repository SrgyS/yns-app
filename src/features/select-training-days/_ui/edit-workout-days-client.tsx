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
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'

interface EditWorkoutDaysClientProps {
  enrollmentId: string
  initialSelectedDays: DayOfWeek[]
  allowedDayOptions?: number[]
}

export function EditWorkoutDaysClient({
  enrollmentId,
  initialSelectedDays,
  allowedDayOptions,
}: EditWorkoutDaysClientProps) {
  const dayOptions =
    allowedDayOptions && allowedDayOptions.length > 0
      ? Array.from(new Set(allowedDayOptions)).sort((a, b) => a - b)
      : [initialSelectedDays.length || 5]
  const hasChoice = dayOptions.length > 1
  const singleOptionValue = dayOptions[0]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number | null>(
    () => {
      if (hasChoice) {
        if (
          initialSelectedDays.length > 0 &&
          dayOptions.includes(initialSelectedDays.length)
        ) {
          return initialSelectedDays.length
        }
        return null
      }
      return singleOptionValue
    }
  )
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
    if (!targetDaysPerWeek || days.length !== targetDaysPerWeek) {
      return
    }
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
        await workoutUtils.getUserDailyPlan.invalidate()
        await courseEnrollmentUtils.course.getEnrollment.invalidate()
        // Добавляем инвалидацию getEnrollmentByCourseSlug
        await courseEnrollmentUtils.course.getEnrollmentByCourseSlug.invalidate()

        // Если не сохраняем прогресс, очищаем стор
        if (!keepProgress) {
          // Очищаем стор с отметками о выполнении тренировок
          useWorkoutCompletionStore.setState({ completions: {} })
        } else {
          // Если сохраняем прогресс, очищаем стор,
          // чтобы состояние подтянулось из актуальных шагов расписания
          useWorkoutCompletionStore.setState({ completions: {} })
        }
      } else {
        console.error('ошибка при обновлении дней тренировок')
        toast.error('Не удалось обновить дни тренировок!')
      }

      router.push(`/cabinet/profile/${userId}`)
    } catch (error) {
      console.error('Error handling workout days:', error)
      toast.error('Произошла ошибка при сохранении дней тренировок')
    } finally {
      setIsSubmitting(false)
      setIsDialogOpen(false)
    }
  }

  const handleModeChange = (value: number | null) => {
    if (!hasChoice) return
    setTargetDaysPerWeek(prev => {
      if (prev === value) return prev
      return value
    })
    setSelectedDays([])
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card">
      <h2 className="text-xl font-semibold text-center">
        Изменить дни тренировок
      </h2>
      {hasChoice ? (
        <p className="text-sm text-muted-foreground text-center">
          Выберите новое количество тренировок в неделю, затем отметьте
          конкретные дни.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Для этого курса предусмотрено {singleOptionValue ?? 0} тренировок в
          неделю.
        </p>
      )}
      {hasChoice ? (
        <div className="flex justify-center gap-3">
          {dayOptions.map(option => (
            <div
              key={option}
              className="flex items-center gap-2 rounded-md border px-4 py-2"
            >
              <Checkbox
                id={`edit-workouts-${option}`}
                checked={targetDaysPerWeek === option}
                disabled={isSubmitting || isUpdating}
                onCheckedChange={checked =>
                  handleModeChange(checked ? option : null)
                }
              />
              <Label
                htmlFor={`edit-workouts-${option}`}
                className="cursor-pointer select-none"
                onClick={() =>
                  handleModeChange(targetDaysPerWeek === option ? null : option)
                }
              >
                {option} тренировки
              </Label>
            </div>
          ))}
        </div>
      ) : null}

      <WorkoutDaySelector
        key={targetDaysPerWeek ?? 'disabled'}
        onSelectDays={handleDaysSelection}
        requiredDays={targetDaysPerWeek ?? 0}
        initialSelectedDays={
          targetDaysPerWeek && initialSelectedDays.length === targetDaysPerWeek
            ? initialSelectedDays
            : []
        }
        isLoading={isSubmitting || isUpdating}
        disabled={!targetDaysPerWeek}
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
