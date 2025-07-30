import { useCallback } from 'react'
import { DayOfWeek } from '@prisma/client'
import { courseEnrollmentApi } from '@/features/course-enrollment/_api'
import { toast } from 'sonner'

export function useUpdateWorkoutDays() {
  const updateWorkoutDaysMutation = courseEnrollmentApi.course.updateWorkoutDays.useMutation()

  const updateWorkoutDays = useCallback(
    async (params: { enrollmentId: string; selectedWorkoutDays: DayOfWeek[] }) => {
      try {
        const result = await updateWorkoutDaysMutation.mutateAsync(params)
        toast.success('Дни тренировок успешно обновлены')
        return result
      } catch (error) {
        console.error('Error updating workout days:', error)
        toast.error('Ошибка при обновлении дней тренировок')
        throw error
      }
    },
    [updateWorkoutDaysMutation]
  )

  return {
    updateWorkoutDays,
    isUpdating: updateWorkoutDaysMutation.isPending,
  }
} 