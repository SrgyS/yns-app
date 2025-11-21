import { redirect, notFound } from 'next/navigation'
import { server } from '@/app/server'
import {
  GetEnrollmentByIdService,
  GetCourseService,
} from '@/entities/course/module'
import { SessionService } from '@/kernel/lib/next-auth/module'
// Импортируем из индексного файла
import { EditWorkoutDaysClient } from '@/features/select-training-days/_ui/edit-workout-days-client'

export default async function EditWorkoutDays({
  params,
}: {
  params: Promise<{ enrollmentId: string }>
}) {
  // Проверка аутентификации
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const userId = session.user.id
  const { enrollmentId } = await params

  // Получение данных
  const getEnrollmentByIdService = server.get(GetEnrollmentByIdService)
  const getCourseService = server.get(GetCourseService)

  // Получаем запись на курс по ID
  const enrollment = await getEnrollmentByIdService.exec(enrollmentId)

  // Если запись не найдена или принадлежит другому пользователю, возвращаем 404
  if (!enrollment || enrollment.userId !== userId) {
    return notFound()
  }

  // Получаем курс по ID из записи на курс
  const course = await getCourseService.exec({ id: enrollment.courseId })

  // Если курс не найден, возвращаем 404
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
    <main className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <EditWorkoutDaysClient
        enrollmentId={enrollmentId}
        initialSelectedDays={currentWorkoutDays}
        allowedDayOptions={allowedDayOptions}
      />
    </main>
  )
}
