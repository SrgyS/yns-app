import { redirect, notFound } from 'next/navigation'
import { server } from '@/app/server'
import { GetEnrollmentByIdService } from '@/entity/course/module'
import { SessionService } from '@/kernel/lib/next-auth/server'
// Импортируем из индексного файла
import { EditWorkoutDaysClient } from '@/features/select-training-days/_ui/edit-workout-days-client'

export default async function EditWorkoutDays({ params }: { params: Promise<{ enrollmentId: string }> }) {
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
  
  // Получаем запись на курс по ID
  const enrollment = await getEnrollmentByIdService.exec(enrollmentId)
  
  // Если запись не найдена или принадлежит другому пользователю, возвращаем 404
  if (!enrollment || enrollment.userId !== userId) {
    return notFound()
  }
  
  const currentWorkoutDays = enrollment.selectedWorkoutDays

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <EditWorkoutDaysClient
        userId={userId}
        initialSelectedDays={currentWorkoutDays}
        minDays={5}
        maxDays={5}
      />
    </main>
  )
}
