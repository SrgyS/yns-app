import { DailyContentType } from '@/shared/lib/client-enums'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { workoutApi } from '../_api'
import {
  useWorkoutCompletionStore,
  createCompletionKey,
} from '@/shared/store/workout-completion-store'
import { isAbortLikeError } from '@/shared/lib/query/errors'

export function useWorkoutCompletions() {
  const { data: session } = useAppSession()
  // Получаем утилиты для инвалидации кэша
  const utils = workoutApi.useUtils()

  // Мутация для обновления статуса выполнения тренировки
  const updateWorkoutCompletionMutation =
    workoutApi.updateWorkoutCompletion.useMutation({
      // При успешном обновлении инвалидируем кэш и обновляем стор
      onSuccess: (_, variables) => {
        const { enrollmentId, contentType, stepIndex, isCompleted } = variables
        const workoutId = variables.workoutId
        const userId = session?.user?.id

        // Создаем ключ для хранения в сторе
        if (!userId) {
          return
        }

        const key = createCompletionKey(
          userId,
          enrollmentId,
          contentType,
          stepIndex,
          workoutId
        )

        // Обновляем значение в сторе
        useWorkoutCompletionStore.getState().setCompletion(key, isCompleted)

        // Инвалидируем конкретный запрос в React Query
        utils.getWorkoutCompletionStatus.invalidate({
          workoutId,
          enrollmentId,
          contentType,
          stepIndex,
        })
      },
    })

  // Функция для обновления статуса выполнения тренировки
  const updateWorkoutCompletion = async (params: {
    workoutId: string
    enrollmentId: string
    contentType: DailyContentType
    stepIndex: number
    isCompleted: boolean
  }) => {
    try {
      await updateWorkoutCompletionMutation.mutateAsync(params)
      return true
    } catch (error) {
      if (isAbortLikeError(error)) {
        return false
      }

      console.error('Error updating workout completion status:', error)
      return false
    }
  }

  return {
    updateWorkoutCompletion,
    isUpdating: updateWorkoutCompletionMutation.isPending,
  }
}
