import { DayOfWeek } from '@prisma/client'
import type {
  UserCourseEnrollment,
  UserCourseEnrollmentApi,
} from '@/entities/course'
import { ContentType } from '@/kernel/domain/course'

import { toast } from 'sonner'
import { courseEnrollmentApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

type EnrollmentShape = UserCourseEnrollment | UserCourseEnrollmentApi

export type CourseAccessState = {
  hasAccess: boolean
  enrollment: EnrollmentShape | null
  activeEnrollment: EnrollmentShape | null
  isActive: boolean
  accessExpiresAt: string | Date | null
  setupCompleted: boolean
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
    'accessExpiresAt' in value &&
    'setupCompleted' in value
  )
}

// --- Query Hooks ---

export function useEnrollmentQuery(userId: string, courseId: string) {
  return courseEnrollmentApi.course.getEnrollment.useQuery(
    { userId, courseId },
    CACHE_SETTINGS.FREQUENT_UPDATE
  )
}

export function useUserEnrollmentsQuery(userId: string) {
  return courseEnrollmentApi.course.getUserEnrollments.useQuery({ userId })
}

export function useActiveEnrollmentQuery(userId: string) {
  return courseEnrollmentApi.course.getActiveEnrollment.useQuery({ userId })
}

export function useUserWorkoutDaysQuery(userId: string, courseId: string) {
  return courseEnrollmentApi.course.getUserWorkoutDays.useQuery({ userId, courseId })
}

export function useEnrollmentByCourseSlugQuery(userId: string, courseSlug: string) {
  return courseEnrollmentApi.course.getEnrollmentByCourseSlug.useQuery(
    { userId, courseSlug },
    CACHE_SETTINGS.FREQUENT_UPDATE
  )
}

export function useCheckAccessByCourseSlugQuery(
  userId: string,
  courseSlug: string,
  options?: Parameters<
    typeof courseEnrollmentApi.course.checkAccessByCourseSlug.useQuery
  >[1]
) {
  return courseEnrollmentApi.course.checkAccessByCourseSlug.useQuery(
    { userId, courseSlug },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      ...options,
    }
  )
}

export function useAvailableWeeksQuery(userId: string, courseSlug: string) {
  return courseEnrollmentApi.course.getAvailableWeeks.useQuery(
    { userId, courseSlug },
    CACHE_SETTINGS.FREQUENT_UPDATE
  )
}

export function useAccessibleEnrollmentsQuery(
  options?: Parameters<
    typeof courseEnrollmentApi.course.getAccessibleEnrollments.useQuery
  >[1]
) {
  return courseEnrollmentApi.course.getAccessibleEnrollments.useQuery(
    undefined,
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      ...options,
    }
  )
}

// --- Mutation / Action Hook ---

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
          utils.course.getAccessibleEnrollments.invalidate(),
        ])
      },
    })

  const { mutateAsync: activateEnrollment, isPending: isActivating } =
    courseEnrollmentApi.course.activateEnrollment.useMutation({
      async onSuccess() {
        // Инвалидируем все запросы, связанные с записями пользователя на курсы
        await Promise.all([
          utils.course.getUserEnrollments.invalidate(),
          utils.course.getActiveEnrollment.invalidate(),
          utils.course.getAccessibleEnrollments.invalidate(),
        ])
        toast.success('Курс выбран!')
      },
      onError() {
        toast.error('Ошибка при выборе курса')
      },
    })

  const updateWorkoutDaysMutation =
    courseEnrollmentApi.course.updateWorkoutDays.useMutation({
      async onSuccess() {
        await Promise.all([
          utils.course.getUserEnrollments.invalidate(),
          utils.course.getActiveEnrollment.invalidate(),
          utils.course.getAccessibleEnrollments.invalidate(),
        ])
      },
    })

  const createEnrollment = async (params: {
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
  }

  const updateWorkoutDays = async (params: {
    enrollmentId: string
    selectedWorkoutDays: DayOfWeek[]
    keepProgress?: boolean
  }) => {
    try {
      await updateWorkoutDaysMutation.mutateAsync(params)
    } catch (error) {
      console.error('Error updating workout days:', error)
      throw error
    }
  }

  return {
    createEnrollment,
    activateEnrollment,
    updateWorkoutDays,
    isCreating: createEnrollmentMutation.isPending,
    isActivating,
  }
}
