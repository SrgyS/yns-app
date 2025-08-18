import { useCallback } from 'react'
import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

export function useWorkout() {
  // Функция для получения тренировки с кешированием
  const getWorkout = useCallback((workoutId: string) => {
    return workoutApi.getWorkout.useQuery(
      { workoutId },
      CACHE_SETTINGS.FREQUENT_UPDATE
    )
  }, [])

  return {
    getWorkout,
  }
}
