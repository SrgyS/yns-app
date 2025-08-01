import { WorkoutDaySelector } from '@/features/select-training-days/_ui/workout-day-selector'
// Используем API из хука useCourseEnrollment вместо прямого импорта
import { server } from '@/app/server'
import { GetUserWorkoutDaysService } from '@/entity/course/module'
import { redirect } from 'next/navigation'
import { SessionService } from '@/kernel/lib/next-auth/server'

export default async function SelectTrainingDays() {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const userId = session.user.id
  const userWorkoutDaysService = server.get(GetUserWorkoutDaysService)
  const currentWorkoutDays = await userWorkoutDaysService.execute(userId)
  // const { id: courseId } = useParams()
  // const router = useRouter()

  // const handleDaysSelection = async (selectedDays: DayOfWeek[]) => {
  //   try {
  //     await createEnrollment({
  //       courseId: courseId as string,
  //       selectedWorkoutDays: selectedDays,
  //       startDate: new Date(),
  //     })

  //     router.push('/day')
  //   } catch (error) {
  //     console.error('Error creating enrollment:', error)
  //     toast('Произошла ошибка')
  //   }
  // }

  return (
    <main className="flex flex-col justify-centerspace-y-6 py-14 container  max-w-[800px]">
      <WorkoutDaySelector
        // onSelectDays={handleDaysSelection}
        minDays={5}
        maxDays={5}
        initialSelectedDays={currentWorkoutDays}
      />
    </main>
  )
}
