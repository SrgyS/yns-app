import { useCallback } from 'react'
import { DayOfWeek } from '@prisma/client'
import type {
  UserCourseEnrollment,
  UserCourseEnrollmentApi,
} from '@/entities/course'
import { ContentType } from '@/kernel/domain/course'

import { toast } from 'sonner'
import { courseEnrollmentApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
//TODO: проверить используются ли все методы

type EnrollmentShape = UserCourseEnrollment | UserCourseEnrollmentApi

export type CourseAccessState = {
  hasAccess: boolean
  enrollment: EnrollmentShape | null
  activeEnrollment: EnrollmentShape | null
  isActive: boolean
  accessExpiresAt: string | Date | null
}

export const isCourseAccessState = (
  value: unknown
): value is CourseAccessState => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return (
    'hasAccess' in value &&
    'enrollment' in value &&
    'activeEnrollment' in value &&
    'isActive' in value &&
    'accessExpiresAt' in value
  )
}

export function useCourseEnrollment() {
  const utils = courseEnrollmentApi.useUtils()

  const createEnrollmentMutation =
    courseEnrollmentApi.course.createEnrollment.useMutation({
      async onSuccess() {
        await Promise.all([
          utils.course.getUserEnrollments.invalidate(),
          utils.course.getActiveEnrollment.invalidate(),
          utils.course.getEnrollmentByCourseSlug.invalidate(),
          utils.course.checkAccessByCourseSlug.invalidate(),
        ])
      },
    })

  const getEnrollmentQuery = courseEnrollmentApi.course.getEnrollment.useQuery

  const getUserWorkoutDaysQuery =
    courseEnrollmentApi.course.getUserWorkoutDays.useQuery

  const createEnrollment = useCallback(
    async (params: {
      courseId: string
      courseContentType: ContentType
      startDate: Date
      selectedWorkoutDays: DayOfWeek[]
      hasFeedback?: boolean
    }) => {
      try {
        const result = await createEnrollmentMutation.mutateAsync(params)
        return result
      } catch (error) {
        throw error
      }
    },
    [createEnrollmentMutation]
  )

  const getEnrollment = useCallback(
    (userId: string, courseId: string) => {
      return getEnrollmentQuery(
        { userId, courseId },
         CACHE_SETTINGS.FREQUENT_UPDATE
      )
    },
    [getEnrollmentQuery]
  )

  const getUserEnrollmentsQuery =
    courseEnrollmentApi.course.getUserEnrollments.useQuery

  const getActiveEnrollmentQuery =
    courseEnrollmentApi.course.getActiveEnrollment.useQuery

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
    (userId: string, courseId: string) => {
      return getUserWorkoutDaysQuery({ userId, courseId })
    },
    [getUserWorkoutDaysQuery]
  )

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
      },
    })

  const getEnrollmentByCourseSlugQuery =
    courseEnrollmentApi.course.getEnrollmentByCourseSlug.useQuery
  const checkAccessByCourseSlugQuery =
    courseEnrollmentApi.course.checkAccessByCourseSlug.useQuery

  const getEnrollmentByCourseSlug = useCallback(
    (userId: string, courseSlug: string) => {
      return getEnrollmentByCourseSlugQuery(
        { userId, courseSlug },
        CACHE_SETTINGS.FREQUENT_UPDATE
      )
    },
    [getEnrollmentByCourseSlugQuery]
  )

  const checkAccessByCourseSlug = useCallback(
    (
      userId: string,
      courseSlug: string,
      options?: Parameters<typeof checkAccessByCourseSlugQuery>[1]
    ) => {
      return checkAccessByCourseSlugQuery(
        { userId, courseSlug },
        {
          ...CACHE_SETTINGS.FREQUENT_UPDATE,
          ...(options ?? {}),
        }
      )
    },
    [checkAccessByCourseSlugQuery]
  )

  const getAvailableWeeksQuery =
    courseEnrollmentApi.course.getAvailableWeeks.useQuery

  const getAvailableWeeks = useCallback(
    (userId: string, courseSlug: string) => {
      return getAvailableWeeksQuery(
        { userId, courseSlug },
        CACHE_SETTINGS.FREQUENT_UPDATE
      )
    },
    [getAvailableWeeksQuery]
  )
  return {
    createEnrollment,
    getEnrollment,
    getUserEnrollments,
    getActiveEnrollment,
    getUserWorkoutDays,
    activateEnrollment,
    getEnrollmentByCourseSlug,
    checkAccessByCourseSlug,
    getAvailableWeeks,
    isCreating: createEnrollmentMutation.isPending,
    isActivating,
  }
}
