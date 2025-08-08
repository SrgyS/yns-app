
import { EditWorkoutDaysButton } from './edit-workout-days-button'
import { Separator } from '@/shared/ui/separator'
import { DAY_LABELS } from '@/features/select-training-days/constants'
import { DayOfWeek } from '@prisma/client'
import { UserCourseEnrollmentApi } from '@/entity/course/_domain/course'




export const EditWorkoutDaysField = ({enrollment}: {enrollment: UserCourseEnrollmentApi}) => {
  const formatWorkoutDays = (days: string[]) => {

  // Порядок дней недели
  const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  
  // Сортировка дней по порядку
  const sortedDays = [...days].sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b)
  })

  return sortedDays.map(day => DAY_LABELS[day as DayOfWeek] || day).join(', ')
}

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Дни тренировок:</h3>
        <Separator />
      </div>
      <div className="flex flex-wrap gap-2">
        {formatWorkoutDays(enrollment.selectedWorkoutDays || [])}
      </div>
      <EditWorkoutDaysButton id={enrollment.id} />
    </div>
  )
}
