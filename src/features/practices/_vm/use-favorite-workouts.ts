'use client'

import { workoutApi } from '@/features/daily-plan/_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

type UseFavoriteWorkoutsOptions = {
  enabled?: boolean
}

export function useFavoriteWorkoutDetails(
  options: UseFavoriteWorkoutsOptions = {}
) {
  const enabled = options.enabled ?? true

  return workoutApi.getFavoriteWorkoutDetails.useQuery(undefined, {
    ...CACHE_SETTINGS.FREQUENT_UPDATE,
    enabled,
    retry: false,
  })
}
