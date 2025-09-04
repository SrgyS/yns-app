import { useCallback } from 'react'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'

export function useDailyPlan() {
  const { getUserDailyPlan } = useCourseEnrollment()
  const { data: session } = useAppSession()

  const getDailyPlan = useCallback(
    (courseId: string, dayNumberInCourse: number, enabled: boolean) => {
      const userId = session?.user?.id || ''
      const isEnabled = enabled && Boolean(session?.user?.id)
      return getUserDailyPlan(userId, courseId, dayNumberInCourse, isEnabled)
    },
    [getUserDailyPlan, session?.user?.id]
  )

  return {
    getDailyPlan,
  }
}
