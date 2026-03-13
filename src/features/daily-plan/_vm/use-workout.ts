import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { shouldRetryQuery } from '@/shared/lib/query/errors'

export function useWorkoutQuery(workoutId: string) {
  return workoutApi.getWorkout.useQuery(
    { workoutId },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      enabled: Boolean(workoutId),
      retry: shouldRetryQuery,
      trpc: {
        abortOnUnmount: true,
      },
    }
  )
}
