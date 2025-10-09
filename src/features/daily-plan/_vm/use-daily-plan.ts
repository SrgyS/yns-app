import { useCallback } from 'react'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

export function useDailyPlan() {
  const { data: session } = useAppSession()
  const getUserDailyPlan = workoutApi.getUserDailyPlan.useQuery

  const getDailyPlan = useCallback(
    (courseId: string, dayNumberInCourse: number, enabled: boolean) => {
      const userId = session?.user?.id || ''
      const isEnabled = enabled && Boolean(session?.user?.id)
      return getUserDailyPlan(
        { userId, courseId, dayNumberInCourse },
        { ...CACHE_SETTINGS.FREQUENT_UPDATE, enabled: isEnabled }
      )
    },
    [getUserDailyPlan, session?.user?.id]
  )

  return {
    getDailyPlan,
  }
}
