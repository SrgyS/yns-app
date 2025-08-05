import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { EditWorkoutDaysButton } from './edit-workout-days-button'
import { UserId } from '@/kernel/domain/user'
import { Separator } from '@/shared/ui/separator'
import { DAY_LABELS } from '@/features/select-training-days/constants'
import { DayOfWeek } from '@prisma/client'

const formatWorkoutDays = (days: string[]) => {

  // Порядок дней недели
  const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  
  // Сортировка дней по порядку
  const sortedDays = [...days].sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b)
  })

  return sortedDays.map(day => DAY_LABELS[day as DayOfWeek] || day).join(', ')
}

export const EditWorkoutDaysField = ({ userId }: { userId: UserId }) => {
  const { getUserEnrollments } = useCourseEnrollment()
  const enrollmentsQuery = getUserEnrollments(userId || '')

  // Получаем все enrollments для селектора
  const enrollments = enrollmentsQuery?.data || []

  //   if (isLoading) {
  //     return <Spinner aria-label="Загрузка курсов" />
  //   }

  if (!enrollments || enrollments.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Дни тренировок:</h3>
        <Separator />
      </div>
      <div className="flex flex-wrap gap-2">
        {formatWorkoutDays(enrollments[0].selectedWorkoutDays)}
      </div>
      <EditWorkoutDaysButton />
    </div>
  )
}
