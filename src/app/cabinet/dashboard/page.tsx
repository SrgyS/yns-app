import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'
import { ProfileAvatar } from '@/entities/user/client'
import { Button } from '@/shared/ui/button'
import { ToggleTheme } from '@/features/theme/toggle-theme'
import Link from 'next/link'

export default async function DashboardPage() {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    return null
  }

  const getAccessibleEnrollmentsService = server.get(
    GetAccessibleEnrollmentsService
  )
  const accessibleEnrollments = await getAccessibleEnrollmentsService.exec(
    session.user.id
  )

  const hasPurchasedCourses = accessibleEnrollments.length > 0
  const user = session.user
  const canAccessAdmin = user.role === 'ADMIN' || user.role === 'STAFF'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-end md:hidden mb-4">
        <ToggleTheme variant="outline" />
      </div>

      <div className="mb-10 flex flex-col items-center gap-4">
        <ProfileAvatar profile={user} className="w-24 h-24" />
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">{user.name || 'Пользователь'}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary" className="gap-2">
            <Link href={`/cabinet/profile/${user.id}/edit`}>
              Изменить профиль
            </Link>
          </Button>
          {canAccessAdmin ? (
            <Button asChild size="sm" className="gap-2">
              <Link href="/admin/courses">Админ-панель</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Мои курсы</h2>

        {hasPurchasedCourses ? (
          <div className="grid md:grid-cols-2 gap-6">
            {accessibleEnrollments.map(item => (
              <div
                key={item.enrollment.id}
                className="border rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{item.course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.enrollment.active ? (
                        <span className="text-green-600 dark:text-green-400">
                          ● Активен
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          ○ Не активен
                        </span>
                      )}
                    </p>
                  </div>
                  {item.enrollment.active ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                      Текущий
                    </span>
                  ) : null}
                </div>

                {item.accessExpiresAt ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    Доступ до:{' '}
                    {new Date(item.accessExpiresAt).toLocaleDateString('ru-RU')}
                  </p>
                ) : null}

                <Button asChild className="w-full">
                  <Link href={`/platform/plan?course=${item.course.slug}`}>
                    Перейти к обучению →
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">
              У вас пока нет купленных продуктов
            </h3>
            <p className="text-muted-foreground mb-6">
              Выберите курс и начните свой путь к здоровью и красоте
            </p>
            <Button asChild>
              <Link href="/site/courses">Перейти к курсам</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col justify-center items-center gap-6">
        <Button className='max-w-fit'asChild>
          <Link href="/cabinet/dashboard/orders">История заказов</Link>
        </Button>
        <Button className='max-w-fit' asChild>
          <Link href="/site">Перейти к курсам</Link>
        </Button>
      </section>
    </div>
  )
}
