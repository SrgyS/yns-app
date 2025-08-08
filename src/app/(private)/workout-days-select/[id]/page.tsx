import { server } from '@/app/server'
import {
  GetCourseService,
  GetUserWorkoutDaysService,
} from '@/entity/course/module'
import { redirect } from 'next/navigation'
import { SessionService } from '@/kernel/lib/next-auth/server'
// Импортируем из индексного файла
import { SelectWorkoutDaysClient } from '@/features/select-training-days'
import { toast } from 'sonner'

export default async function SelectTrainingDays({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sessionService = server.get(SessionService)
  const getCourseService = server.get(GetCourseService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const userId = session.user.id
  const userWorkoutDaysService = server.get(GetUserWorkoutDaysService)
  const currentWorkoutDays = await userWorkoutDaysService.exec(userId)
  const { id } = await params
  const courseId = id
  const course = await getCourseService.exec({ id: courseId })

  if (!course) {
    toast.error('Курс не найден')
    return redirect('/')
  }

  const minDays = course.minWorkoutDaysPerWeek || 5 

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <SelectWorkoutDaysClient
        courseSlug={course.slug}
        courseId={courseId}
        initialSelectedDays={currentWorkoutDays}
        minDays={minDays}
        maxDays={minDays}
      />
    </main>
  )
}
