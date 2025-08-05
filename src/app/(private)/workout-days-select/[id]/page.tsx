import { server } from '@/app/server'
import { GetUserWorkoutDaysService } from '@/entity/course/module'
import { redirect } from 'next/navigation'
import { SessionService } from '@/kernel/lib/next-auth/server'
// Импортируем из индексного файла
import { SelectWorkoutDaysClient } from '@/features/select-training-days'

export default async function SelectTrainingDays({ params }: { params: { id: string } }) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const userId = session.user.id
  const userWorkoutDaysService = server.get(GetUserWorkoutDaysService)
  const currentWorkoutDays = await userWorkoutDaysService.exec(userId)
  const courseId = params.id

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <SelectWorkoutDaysClient 
        courseId={courseId}
        initialSelectedDays={currentWorkoutDays}
        minDays={5}
        maxDays={5}
      />
    </main>
  )
}
