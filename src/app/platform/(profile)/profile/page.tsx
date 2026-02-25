import Link from 'next/link'
import {
  ChevronRight,
  // Dumbbell,
  Edit,
  Home,
  LayoutDashboard,
  MessageCircle,
} from 'lucide-react'

import { server } from '@/app/server'
import { UserCoursesSection } from '@/features/user-courses/_ui/user-courses-section'
import { ProfileAvatar } from '@/entities/user/client'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { LogoutButton } from '@/features/auth/_ui/logout-button'
import { GetUserCoursesListService } from '@/features/user-courses/module'
import { ToggleTheme } from '@/features/theme/toggle-theme'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'
import { isSupportChatEnabled } from '@/features/support-chat'

export default async function ProfilePage() {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const user = session.user
  const canAccessAdmin = user.role === 'ADMIN' || user.role === 'STAFF'
  const supportChatEnabled = isSupportChatEnabled()

  const getUserCoursesListService = server.get(GetUserCoursesListService)
  const courses = await getUserCoursesListService.exec(session.user.id)

  return (
    <>
      <div className="fixed top-4 right-4 md:hidden">
        <ToggleTheme variant="outline" />
      </div>
      <section className="space-y-8 py-14 max-w-[800px] m-auto">
        <div className="flex flex-col items-center space-y-4">
          <ProfileAvatar profile={user} className="w-24 h-24" />
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              {user.name || 'Пользователь'}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          {canAccessAdmin ? (
            <Button asChild size="sm" className="gap-2">
              <Link href="/admin/courses">
                <LayoutDashboard className="h-4 w-4" />
                Админ-панель
              </Link>
            </Button>
          ) : null}
        </div>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <Button
              asChild
              className="w-full justify-between"
              variant="outline"
            >
              <Link href="/">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Выбрать курс
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              className="w-full justify-between"
              variant="outline"
            >
              <Link href={`/platform/profile/edit`}>
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Изменить профиль
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            {supportChatEnabled ? (
              <Button
                asChild
                className="w-full justify-between"
                variant="outline"
              >
                <Link href="/platform/support-chat">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Чат с поддержкой
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            {/* 
            <Button variant="outline" className="w-full justify-between">
              <Link href="/site/equipment" className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Оборудование для тренировок
              </Link>
              <ChevronRight className="h-4 w-4" />
            </Button> */}
          </CardContent>
        </Card>

        {courses.length > 0 ? (
          <UserCoursesSection courses={courses} />
        ) : (
          <NoAccessCallout
            title="У вас нет доступных курсов"
            description="Оформите подписку или приобретите курс, чтобы получить доступ к материалам."
            ctaHref="/"
            ctaLabel="Выбрать курс или оформить подписку"
          />
        )}

        <Card>
          <CardContent>
            <LogoutButton email={user.email} />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
