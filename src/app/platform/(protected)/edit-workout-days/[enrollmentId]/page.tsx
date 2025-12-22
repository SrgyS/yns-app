import { notFound, redirect } from 'next/navigation'

import { server } from '@/app/server'
import {
  GetEnrollmentByIdService,
  GetCourseService,
} from '@/entities/course/module'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { EditWorkoutDaysClient } from '@/features/select-training-days/_ui/edit-workout-days-client'

export default async function EditWorkoutDays({
  params,
}: {
  params: Promise<{ enrollmentId: string }>
}) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const userId = session.user.id
  const { enrollmentId } = await params

  const getEnrollmentByIdService = server.get(GetEnrollmentByIdService)
  const getCourseService = server.get(GetCourseService)

  const enrollment = await getEnrollmentByIdService.exec(enrollmentId)

  if (!enrollment || enrollment.userId !== userId) {
    return notFound()
  }

  const course = await getCourseService.exec({ id: enrollment.courseId })

  if (!course) {
    return notFound()
  }

  const currentWorkoutDays = enrollment.selectedWorkoutDays
  const allowedDayOptions =
    course.allowedWorkoutDaysPerWeek &&
    course.allowedWorkoutDaysPerWeek.length > 0
      ? course.allowedWorkoutDaysPerWeek
      : [5]

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 max-w-[800px]">
      <EditWorkoutDaysClient
        enrollmentId={enrollmentId}
        initialSelectedDays={currentWorkoutDays}
        allowedDayOptions={allowedDayOptions}
      />
    </main>
  )
}
