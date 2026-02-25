import { useAppSession } from '@/kernel/lib/next-auth/client'
import { workoutApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

export function useDailyPlanQuery(
  enrollmentId: string,
  courseId: string,
  dayNumberInCourse: number,
  enabled: boolean = true
) {
  const { data: session } = useAppSession()
  const userId = session?.user?.id || ''
  const isEnabled = enabled && Boolean(session?.user?.id)

  return workoutApi.getUserDailyPlan.useQuery(
    { userId, enrollmentId, courseId, dayNumberInCourse },
    { ...CACHE_SETTINGS.FREQUENT_UPDATE, enabled: isEnabled }
  )
}
