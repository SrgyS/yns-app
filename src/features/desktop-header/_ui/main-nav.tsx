import Link from 'next/link'
import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/server'
import { GetActiveEnrollmentService } from '@/entity/course/module'

export async function MainNav() {
  // Получаем сессию пользователя
  const sessionService = server.get(SessionService)
  const getActiveEnrollmentService = server.get(GetActiveEnrollmentService)
  
  const session = await sessionService.get()
  
  // Формируем URL для страницы плана
  let planUrl = '/day/'
  
  // Если пользователь авторизован, пытаемся получить его активный курс
  if (session?.user?.id) {
    try {
      const activeEnrollment = await getActiveEnrollmentService.exec(session.user.id)
      if (activeEnrollment?.course?.slug) {
        planUrl = `/day/${activeEnrollment.course.slug}`
      }
    } catch (error) {
      // Если активный курс не найден, используем базовый URL
      console.error('Ошибка при получении активного курса:', error)
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
        className="transition-colors hover:text-foreground/80 text-foreground/60"
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
