'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { DayTabs } from './day-tabs'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCalendar } from '../_vm/use-worckout-calendar'

export function CalendarTabs() {
  const today = new Date()
  const { data: session } = useAppSession()
  const { getActiveEnrollment } = useCourseEnrollment()

  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')

  const enrollment = activeEnrollmentQuery.data
  const programStart = enrollment?.startDate
    ? new Date(enrollment.startDate)
    : null

  const { noProgram, availableWeeks, currentWeekIndex, gridColsClass } =
    useWorkoutCalendar(programStart)

  if (noProgram || !enrollment || !currentWeekIndex) {
    return <div>Нет активного курса</div>
  }

  const courseId = enrollment.courseId
  const defaultWeek = `week-${currentWeekIndex}`
  return (
    <div className="flex flex-col gap-4 font-bold w-full">
      <h3>{format(today, 'LLLL', { locale: ru })}</h3>
      <Tabs
        key={defaultWeek}
        defaultValue={defaultWeek}
        className="space-y-4"
      >
        <TabsList className={`rounded-lg bg-muted p-1 grid ${gridColsClass}`}>
          {availableWeeks.map(w => {
            return (
              <TabsTrigger
                key={w}
                value={`week-${w}`}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                Неделя {w}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {availableWeeks.map(w => (
          <TabsContent key={`week-${w}`} value={`week-${w}`}>
            <DayTabs
              weekNumber={w}
              programStart={programStart!}
              currentDate={today}
              courseId={courseId}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
