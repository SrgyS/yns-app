import { useCallback } from 'react'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'

export function useDailyPlan() {
  const { getUserDailyPlan } = useCourseEnrollment()
  const { data: session } = useAppSession()

  const getDailyPlan = useCallback(
    (courseId: string, date: Date) => {
      if (!session?.user?.id) {
        return null
      }
      return getUserDailyPlan(session.user.id, courseId, date)
    },
    [getUserDailyPlan, session?.user?.id]
  )

  return {
    getDailyPlan,
  }
} 