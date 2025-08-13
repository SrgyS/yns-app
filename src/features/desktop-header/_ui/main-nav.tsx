import Link from 'next/link'
import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/server'
import { GetActiveEnrollmentService, GetUserEnrollmentsService } from '@/entity/course/module'
import { cn } from '@/shared/ui/utils'

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
    <nav className="flex items-center gap-6 text-sm font-medium flex-row">
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/"
      >
        Главная
      </Link>
      <Link
        className={cn(
          "transition-colors hover:text-foreground/80",
          // Если есть активный курс - обычный стиль
          hasActiveCourse ? "text-foreground/60" : 
          // Если есть курсы, но нет активного - выделяем цветом
          hasAnyCourses ? "text-amber-500 font-semibold" :
          // Если нет курсов - приглушенный стиль
          "text-foreground/40"
        )}
        href={planUrl}
      >
        Мой план
      </Link>
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/practices"
      >
        Практики
      </Link>
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/recipes"
      >
        Рецепты
      </Link>
      <Link
        className="transition-colors hover:text-foreground/80 text-foreground/60"
        href="/knowledge"
      >
        Знания
      </Link>
    </nav>
  )
}
