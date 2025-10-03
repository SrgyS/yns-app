import { UserCoursesSection } from '@/features/user-courses/_ui/user-courses-section'
import Link from 'next/link'
import { Edit, Dumbbell, BookOpen, ChevronRight } from 'lucide-react'
import { CoursesRepository } from '@/entities/course/_repositories/course'
import { server } from '@/app/server'
import { ProfileAvatar } from '@/entities/user/client'
import { SessionService } from '@/kernel/lib/next-auth/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { LogoutButton } from '@/features/auth/_ui/logout-button'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const user = session.user

  const coursesRepository = server.get(CoursesRepository)
  const courses = await coursesRepository.coursesList()

  return (
    <main className="space-y-8 py-14 container max-w-[800px]">
      <div className="flex flex-col items-center space-y-4">
        <ProfileAvatar profile={user} className="w-24 h-24" />
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            {user.name || 'Пользователь'}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <Button asChild className="w-full justify-between" variant="outline">
            <Link href={`/profile/${id}/edit`}>
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Изменить профиль
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Инвентарь для тренировок
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Как проходить курс
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <UserCoursesSection id={id} courses={courses} />

      <Card>
        <CardContent>
          <LogoutButton email={user.email} />
        </CardContent>
      </Card>
    </main>
  )
}
