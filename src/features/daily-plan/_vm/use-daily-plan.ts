import { useAppSession } from '@/kernel/lib/next-auth/client'
import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { shouldRetryQuery } from '@/shared/lib/query/errors'

export function useDailyPlanQuery(
  enrollmentId: string,
  courseId: string,
  dayNumberInCourse: number,
  enabled: boolean = true
) {
  const { data: session } = useAppSession()
  const isEnabled = enabled && Boolean(session?.user?.id)

  return workoutApi.getUserDailyPlan.useQuery(
    { enrollmentId, courseId, dayNumberInCourse },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      enabled: isEnabled,
      placeholderData: previousData => previousData,
      retry: shouldRetryQuery,
      trpc: {
        abortOnUnmount: true,
      },
    }
  )
}
