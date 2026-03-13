import { useAppSession } from '@/kernel/lib/next-auth/client'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { DailyContentType } from '@/shared/lib/client-enums'
import { shouldRetryQuery } from '@/shared/lib/query/errors'
import { workoutApi } from '../_api'

type UseWorkoutCompletionStatusParams = {
  workoutId: string
  enrollmentId: string
  contentType: DailyContentType
  stepIndex: number
  enabled?: boolean
}

export function useWorkoutCompletionStatusQuery({
  workoutId,
  enrollmentId,
  contentType,
  stepIndex,
  enabled = true,
}: Readonly<UseWorkoutCompletionStatusParams>) {
  const { data: session } = useAppSession()
  const isEnabled =
    enabled &&
    Boolean(session?.user?.id) &&
    Boolean(workoutId) &&
    Boolean(enrollmentId)

  return workoutApi.getWorkoutCompletionStatus.useQuery(
    {
      workoutId,
      enrollmentId,
      contentType,
      stepIndex,
    },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      enabled: isEnabled,
      retry: shouldRetryQuery,
      trpc: {
        abortOnUnmount: true,
      },
    }
  )
}
