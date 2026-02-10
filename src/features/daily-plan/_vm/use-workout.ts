import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

export function useWorkoutQuery(workoutId: string) {
  return workoutApi.getWorkout.useQuery(
    { workoutId },
    CACHE_SETTINGS.FREQUENT_UPDATE
  )
}
