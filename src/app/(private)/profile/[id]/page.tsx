import { UpdateProfileForm } from '@/features/update-profile/update-profile-form'
import { Separator } from '@/shared/ui/separator'
import { UserCoursesSection } from '@/features/user-courses/_ui/user-courses-section'
import { CoursesRepository } from '@/entity/course/_repositories/course'
import { server } from '@/app/server'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const coursesRepository = server.get(CoursesRepository)
  const courses = await coursesRepository.coursesList()

  return (
    <main className="space-y-10 py-14 container max-w-[800px]">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Профиль</h3>
          <p className="text-sm text-muted-foreground">
            Это как другие пользователи видят вас на сайте
          </p>
        </div>
        <Separator />
        <UpdateProfileForm userId={id} />
      </div>
      <UserCoursesSection id={id} courses={courses} />
    </main>
  )
}
