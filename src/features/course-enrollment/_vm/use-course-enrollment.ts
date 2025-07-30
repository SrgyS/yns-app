import { useCallback } from 'react'
import { DayOfWeek } from '@prisma/client'

import { toast } from 'sonner'
import { courseEnrollmentApi } from '../_api'

export function useCourseEnrollment() {
  const createEnrollmentMutation = courseEnrollmentApi.course.createEnrollment.useMutation()
  const getEnrollmentQuery = courseEnrollmentApi.course.getEnrollment.useQuery

  const createEnrollment = useCallback(
    async (params: {
      courseId: string
      startDate: Date
      selectedWorkoutDays: DayOfWeek[]
      hasFeedback?: boolean
    }) => {
      try {
        const result = await createEnrollmentMutation.mutateAsync(params)
        toast.success('Вы успешно записались на курс!')
        return result
      } catch (error) {
        toast.error('Ошибка при записи на курс')
        throw error
      }
    },
    [createEnrollmentMutation]
  )

  const getEnrollment = useCallback(
    (userId: string, courseId: string) => {
      return getEnrollmentQuery({ userId, courseId })
    },
    [getEnrollmentQuery]
  )

  return {
    createEnrollment,
    getEnrollment,
    isCreating: createEnrollmentMutation.isPending,
  }
}