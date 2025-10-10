import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import {
  GetActiveEnrollmentService,
  GetUserEnrollmentsService,
} from '@/entities/course/module'
import { MainNavClient } from './main-nav-client'

export async function MainNav() {
  // Получаем сессию пользователя
  const sessionService = server.get(SessionService)
  const getActiveEnrollmentService = server.get(GetActiveEnrollmentService)
  const getUserEnrollmentsService = server.get(GetUserEnrollmentsService)
  
  const session = await sessionService.get()
  
  // Формируем URL для страницы плана
  let planUrl = '/day/'
  let hasActiveCourse = false
  let hasAnyCourses = false
  
  // Если пользователь авторизован, пытаемся получить его активный курс
  if (session?.user?.id) {
    try {
      // Получаем активный курс
      const activeEnrollment = await getActiveEnrollmentService.exec(session.user.id)
      if (activeEnrollment?.course?.slug) {
        planUrl = `/day/${activeEnrollment.course.slug}`
        hasActiveCourse = true
      }
      
      // Получаем все курсы пользователя
      const enrollments = await getUserEnrollmentsService.exec(session.user.id)
      hasAnyCourses = enrollments.length > 0
    } catch (error) {
      // Если активный курс не найден, используем базовый URL
      console.error('Ошибка при получении курсов пользователя:', error)
    }
  }
  
  return (
    <MainNavClient
      hasActiveCourse={hasActiveCourse}
      hasAnyCourses={hasAnyCourses}
      planUrl={planUrl}
    />
  )
}
