import { useCallback } from 'react'
import { workoutApi } from '../_api'

export function useWorkout() {
  // Функция для получения тренировки с кешированием
  const getWorkout = useCallback(
    (workoutId: string) => {
      return workoutApi.getWorkout.useQuery(
        { workoutId },
        {
          // Данные устаревают через 1 минуту
          staleTime: 1000 * 60, // 1 минута
          // Хранить в кеше 5 минут
          gcTime: 1000 * 60 * 5,
          // Включаем обновление при монтировании компонента
          refetchOnWindowFocus: false,
          refetchOnMount: 'always',
          refetchOnReconnect: false,
        }
      )
    },
    []
  )

  return {
    getWorkout,
  }
}