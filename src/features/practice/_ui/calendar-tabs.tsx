'use client'

import { format } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { DayTabs } from './day-tabs'

import { ru } from 'date-fns/locale'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'

import { useWorkoutCalendar } from '../_vm/use-worckout-calendar'
import { useEffect, useState } from 'react'

export function CalendarTabs() {
  const today = new Date()
  const { data: session } = useAppSession()
  const { getActiveEnrollment } = useCourseEnrollment()
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(undefined)

  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')

  const enrollment = activeEnrollmentQuery.data
  const programStart = enrollment?.startDate
    ? new Date(enrollment.startDate)
    : null
console.log({programStart})
  const { noProgram, availableWeeks, currentWeekIndex, gridColsClass } =
    useWorkoutCalendar(programStart)

  useEffect(() => {
    // Всегда устанавливаем текущую неделю при изменении currentWeekIndex
    if (currentWeekIndex) {
      setSelectedWeek(`week-${currentWeekIndex}`)
    }
  }, [currentWeekIndex])

  if (noProgram || !enrollment) {
    return <div>Нет активного курса</div>
  }

  const courseId = enrollment.courseId

  return (
    <div className="flex flex-col gap-4 font-bold w-full">
      <h3>{format(today, 'LLLL', { locale: ru })}</h3>
      <Tabs
        value={selectedWeek}
        onValueChange={setSelectedWeek}
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
