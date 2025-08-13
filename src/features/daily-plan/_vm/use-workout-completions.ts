import { useCallback } from 'react'
import { WorkoutType } from '@prisma/client'
import { workoutApi } from '../_api'
import { useWorkoutCompletionStore, createCompletionKey } from '@/shared/store/workout-completion-store'

export function useWorkoutCompletions() {
  // Получаем утилиты для инвалидации кэша
  const utils = workoutApi.useUtils()
  
  // Функция для получения статуса выполнения тренировки
  const getWorkoutCompletionStatus = useCallback(
    async (userId: string, workoutId: string, enrollmentId: string, workoutType: WorkoutType, userDailyPlanId: string): Promise<boolean> => {
      // Если какой-то из параметров отсутствует, возвращаем false
      if (!userId || !workoutId || !enrollmentId) {
        return false
      }
      
      // Создаем ключ для хранения в сторе
      const key = createCompletionKey(userId, workoutId, enrollmentId, workoutType, userDailyPlanId)
      
      // Проверяем, есть ли значение в сторе
      const cachedValue = useWorkoutCompletionStore.getState().getCompletion(key)
      if (cachedValue !== undefined) {
        return cachedValue
      }
      
      try {
        // Создаем ключ запроса
        const queryKey = {
          userId,
          workoutId,
          enrollmentId,
          workoutType,
          userDailyPlanId,
        }
        
        // Запрашиваем данные с сервера
        const result = await utils.getWorkoutCompletionStatus.fetch(queryKey, {
          staleTime: 5 * 60 * 1000, // 5 минут
          gcTime: 10 * 60 * 1000, // 10 минут
        })
        
        // Сохраняем результат в сторе
        useWorkoutCompletionStore.getState().setCompletion(key, result)
        
        return result
      } catch (error) {
        console.error('Error getting workout completion status:', error)
        return false
      }
    },
    [utils]
  )
  
  // Мутация для обновления статуса выполнения тренировки
  const updateWorkoutCompletionMutation = workoutApi.updateWorkoutCompletion.useMutation({
    // При успешном обновлении инвалидируем кэш и обновляем стор
    onSuccess: (_, variables) => {
      const { userId, workoutId, enrollmentId, workoutType, userDailyPlanId, isCompleted } = variables
      
      // Создаем ключ для хранения в сторе
      const key = createCompletionKey(userId, workoutId, enrollmentId, workoutType, userDailyPlanId)
      
      // Обновляем значение в сторе
      useWorkoutCompletionStore.getState().setCompletion(key, isCompleted)
      
      // Инвалидируем конкретный запрос в React Query
      utils.getWorkoutCompletionStatus.invalidate({
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
      })
    },
  })
  
  // Функция для обновления статуса выполнения тренировки
  const updateWorkoutCompletion = useCallback(
    async (params: {
      userId: string
      workoutId: string
      enrollmentId: string
      workoutType: WorkoutType
      isCompleted: boolean
      userDailyPlanId: string
    }) => {
      try {
        await updateWorkoutCompletionMutation.mutateAsync(params)
        return true
      } catch (error) {
        console.error('Error updating workout completion status:', error)
        return false
      }
    },
    [updateWorkoutCompletionMutation]
  )
  
  return {
    getWorkoutCompletionStatus,
    updateWorkoutCompletion,
    isUpdating: updateWorkoutCompletionMutation.isPending,
  }
}