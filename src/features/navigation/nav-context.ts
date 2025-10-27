import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import {
  GetActiveEnrollmentService,
  GetUserEnrollmentsService,
} from '@/entities/course/module'

export type NavigationContext = {
  planUrl: string
  hasActiveCourse: boolean
  hasAnyCourses: boolean
  profileHref: string
  sessionUserId?: string
  isAuthenticated: boolean
}

export async function getNavigationContext(): Promise<NavigationContext> {
  const sessionService = server.get(SessionService)
  const getActiveEnrollmentService = server.get(GetActiveEnrollmentService)
  const getUserEnrollmentsService = server.get(GetUserEnrollmentsService)

  const session = await sessionService.get()

  let planUrl = '/course-access'
  let hasActiveCourse = false
  let hasAnyCourses = false
  const userId = session?.user?.id

  if (userId) {
    try {
      const activeEnrollment = await getActiveEnrollmentService.exec(userId)

      if (activeEnrollment?.course?.slug) {
        planUrl = `/day/${activeEnrollment.course.slug}`
        hasActiveCourse = true
      }

      const enrollments = await getUserEnrollmentsService.exec(userId)
      hasAnyCourses = enrollments.length > 0
    } catch (error) {
      console.error('Ошибка при получении курсов пользователя:', error)
    }
  }

  const profileHref = userId ? `/profile/${userId}` : '/auth/sign-in'
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
