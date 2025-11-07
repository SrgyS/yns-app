'use client'

import { useCallback, useMemo } from 'react'

import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

type UseWorkoutFavoritesOptions = {
  enabled?: boolean
}

type ToggleContext = {
  previousFavorites?: string[]
}

export function useWorkoutFavorites(
  options: UseWorkoutFavoritesOptions = {}
) {
  const enabled = options.enabled ?? true
  const utils = workoutApi.useUtils()

  const favoritesQuery = workoutApi.getFavoriteWorkouts.useQuery(undefined, {
    ...CACHE_SETTINGS.FREQUENT_UPDATE,
    enabled,
  })

  const toggleMutation = workoutApi.toggleFavoriteWorkout.useMutation({
    async onMutate(variables): Promise<ToggleContext> {
      if (!enabled) {
        return {}
      }

      await utils.getFavoriteWorkouts.cancel()

      const previousFavorites = utils.getFavoriteWorkouts.getData()
      const updated = new Set(previousFavorites ?? [])

      if (updated.has(variables.workoutId)) {
        updated.delete(variables.workoutId)
      } else {
        updated.add(variables.workoutId)
      }

      utils.getFavoriteWorkouts.setData(undefined, Array.from(updated))

      return { previousFavorites }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFavorites !== undefined) {
        utils.getFavoriteWorkouts.setData(undefined, context.previousFavorites)
      }
    },
    onSettled: () => {
      utils.getFavoriteWorkouts.invalidate()
    },
  })

  const favoritesSet = useMemo(() => {
    const data = favoritesQuery.data ?? []
    return new Set(data)
  }, [favoritesQuery.data])

  const isFavorite = useCallback(
    (workoutId: string) => favoritesSet.has(workoutId),
    [favoritesSet]
  )

  const toggleFavorite = useCallback(
    async (workoutId: string) => {
      if (!enabled) {
        return
      }

      await toggleMutation.mutateAsync({ workoutId })
    },
    [enabled, toggleMutation]
  )

  return {
    favorites: favoritesQuery.data ?? [],
    isFavorite,
    toggleFavorite,
    isLoading: favoritesQuery.isLoading,
    isFetching: favoritesQuery.isFetching,
    isToggling: toggleMutation.isPending,
    error: favoritesQuery.error ?? toggleMutation.error,
  }
}
