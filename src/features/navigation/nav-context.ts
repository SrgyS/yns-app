import { cache } from 'react'
import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { GetActiveEnrollmentService } from '@/entities/course/module'
import { GetUserEnrollmentsService } from '@/features/course-enrollment/_services/get-user-enrollments'

export type NavigationContext = {
  planUrl: string
  hasActiveCourse: boolean
  hasAnyCourses: boolean
  profileHref: string
  sessionUserId?: string
  isAuthenticated: boolean
}

export const getNavigationContext = cache(
  async (): Promise<NavigationContext> => {
    const sessionService = server.get(SessionService)
    const getActiveEnrollmentService = server.get(GetActiveEnrollmentService)
    const getUserEnrollmentsService = server.get(GetUserEnrollmentsService)

    const session = await sessionService.get()

    let planUrl = '/platform/plan'
    let hasActiveCourse = false
    let hasAnyCourses = false
    const userId = session?.user?.id

    if (userId) {
      try {
        const [activeEnrollment, enrollments] = await Promise.all([
          getActiveEnrollmentService.exec(userId),
          getUserEnrollmentsService.exec(userId),
        ])

        if (activeEnrollment?.course?.slug) {
          planUrl = `/platform/day/${activeEnrollment.course.slug}`
          hasActiveCourse = true
        }

        hasAnyCourses = enrollments.length > 0
      } catch (error) {
        console.error('Ошибка при получении курсов пользователя:', error)
      }
    }

    const profileHref = userId
      ? `/cabinet/profile/${userId}`
      : '/auth/sign-in'
    const isAuthenticated = Boolean(userId)

    return {
      planUrl,
      hasActiveCourse,
      hasAnyCourses,
      profileHref,
      sessionUserId: userId,
      isAuthenticated,
    }
  }
)
