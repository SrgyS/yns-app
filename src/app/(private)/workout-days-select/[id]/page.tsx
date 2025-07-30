'use client'
import { DayOfWeek } from '@prisma/client'
import { useParams, useRouter } from 'next/navigation'
import { WorkoutDaySelector } from '@/features/select-training-days/_ui/workout-day-selector'
import { courseEnrollmentHttpApi } from '@/features/course-enrollment/_api'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SelectTrainingDays() {
  const { id: courseId } = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDaysSelection = async (selectedDays: DayOfWeek[]) => {
    try {
      setIsLoading(true)

      await courseEnrollmentHttpApi.course.createEnrollment.mutate({
        courseId: courseId as string,
        selectedWorkoutDays: selectedDays,
        startDate: new Date(),
      })

      router.push('/day')
    } catch (error) {
      console.error('Error creating enrollment:', error)
      toast('Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col justify-centerspace-y-6 py-14 container  max-w-[800px]">
      <WorkoutDaySelector
        onSelectDays={handleDaysSelection}
        minDays={5}
        maxDays={5}
        isLoading={isLoading}
      />
    </main>
  )
}
