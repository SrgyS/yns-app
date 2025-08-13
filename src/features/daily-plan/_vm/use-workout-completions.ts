import { useCallback } from 'react'
import { WorkoutType } from '@prisma/client'
import { workoutApi } from '../_api'

export function useWorkoutCompletions() {
  // Получаем утилиты для инвалидации кэша
  const utils = workoutApi.useUtils()
  
  // Функция для получения статуса выполнения тренировки
  const getWorkoutCompletionStatus = useCallback(
    (userId: string, workoutId: string, enrollmentId: string, workoutType: WorkoutType, userDailyPlanId: string): boolean => {
      // Если какой-то из параметров отсутствует, возвращаем false
      if (!userId || !workoutId || !enrollmentId) {
        return false
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
        
        // Получаем данные из кэша
        const cachedData = utils.getWorkoutCompletionStatus.getData(queryKey)
        
        // Если данные есть в кэше, возвращаем их
        if (cachedData !== undefined) {
          return cachedData
        }
        
        // Если данных нет в кэше, запускаем запрос в фоне с помощью prefetch
        // и возвращаем false (тренировка не выполнена)
        utils.getWorkoutCompletionStatus.prefetch(queryKey, {
          staleTime: 5 * 60 * 1000, // 5 минут
          gcTime: 10 * 60 * 1000, // 10 минут
        })
        
        return false
      } catch (error) {
        console.error('Error getting workout completion status:', error)
        return false
      }
    },
    [utils]
  )
  
  // Мутация для обновления статуса выполнения тренировки
  const updateWorkoutCompletionMutation = workoutApi.updateWorkoutCompletion.useMutation({
    // При успешном обновлении инвалидируем кэш
    onSuccess: (_, variables) => {
      const { userId, workoutId, enrollmentId, workoutType, userDailyPlanId } = variables
      
      // Инвалидируем конкретный запрос
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