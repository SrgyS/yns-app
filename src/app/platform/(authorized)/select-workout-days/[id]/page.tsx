import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { GetCourseService } from '@/entities/course/module'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { SelectWorkoutDaysClient } from '@/features/select-training-days'

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

  const { id } = await params
  const courseId = id

  const course = await getCourseService.exec({ id: courseId })

  if (!course) {
    return redirect('/platform/plan')
  }

  const allowedDayOptions =
    course.allowedWorkoutDaysPerWeek &&
    course.allowedWorkoutDaysPerWeek.length > 0
      ? course.allowedWorkoutDaysPerWeek
      : [5]

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 max-w-[800px]">
      <SelectWorkoutDaysClient
        courseSlug={course.slug}
        courseId={courseId}
        courseContentType={course.contentType}
        initialSelectedDays={[]}
        allowedDayOptions={allowedDayOptions}
      />
    </main>
  )
}
