import { useCallback } from 'react'
import { DayOfWeek } from '@prisma/client'

import { toast } from 'sonner'
import { courseEnrollmentApi } from '../_api'
//TODO: проверить используются ли все методы
export function useCourseEnrollment() {
  const createEnrollmentMutation =
    courseEnrollmentApi.course.createEnrollment.useMutation()

  const getEnrollmentQuery = courseEnrollmentApi.course.getEnrollment.useQuery

  const getUserWorkoutDaysQuery =
    courseEnrollmentApi.course.getUserWorkoutDays.useQuery

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

  const getUserDailyPlanQuery =
    courseEnrollmentApi.course.getUserDailyPlan.useQuery

  const getUserEnrollmentsQuery =
    courseEnrollmentApi.course.getUserEnrollments.useQuery

  const getActiveEnrollmentQuery =
    courseEnrollmentApi.course.getActiveEnrollment.useQuery

  const getUserDailyPlan = useCallback(
    (userId: string, courseId: string, date: Date) => {
      return getUserDailyPlanQuery({ userId, courseId, date })
    },
    [getUserDailyPlanQuery]
  )

  const getUserEnrollments = useCallback(
    (userId: string) => {
      return getUserEnrollmentsQuery({ userId })
    },
    [getUserEnrollmentsQuery]
  )

  const getActiveEnrollment = useCallback(
    (userId: string) => {
      return getActiveEnrollmentQuery({ userId })
    },
    [getActiveEnrollmentQuery]
  )

  const getUserWorkoutDays = useCallback(
    (userId: string) => {
      return getUserWorkoutDaysQuery(userId)
    },
    [getUserWorkoutDaysQuery]
  )

  const utils = courseEnrollmentApi.useUtils()

  const { mutateAsync: activateEnrollment, isPending: isActivating } = 
    courseEnrollmentApi.course.activateEnrollment.useMutation({
      async onSuccess() {
        // Инвалидируем все запросы, связанные с записями пользователя на курсы
        await utils.course.getUserEnrollments.invalidate()
        await utils.course.getActiveEnrollment.invalidate()
        toast.success('Курс выбран!')
      },
      onError() {
        toast.error('Ошибка при выборе курса')
      }
    })

  return {
    createEnrollment,
    getEnrollment,
    getUserDailyPlan,
    getUserEnrollments,
    getActiveEnrollment,
    getUserWorkoutDays,
    activateEnrollment,
    isCreating: createEnrollmentMutation.isPending,
    isActivating,
  }
}
