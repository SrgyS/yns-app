'use client'

import { useState } from 'react'
import { differenceInCalendarWeeks, format } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { DayTabs } from './day-tabs'
import { WEEKS } from '../constant'
import { ru } from 'date-fns/locale'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { CourseSelector } from './course-selector'

export function CalendarTabs() {
  const today = new Date()
  const { data: session } = useAppSession()
  const { getActiveEnrollment, getUserEnrollments } = useCourseEnrollment()

  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')
  const enrollmentsQuery = getUserEnrollments(session?.user?.id || '')

  // Получаем все enrollments для селектора
  const enrollments = enrollmentsQuery?.data || []
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('')

  // Получаем активный enrollment для определения courseId и programStart
  const enrollment = activeEnrollmentQuery?.data
  const courseId = enrollment?.courseId
  const programStart = enrollment?.startDate
    ? new Date(enrollment.startDate)
    : new Date('2025-07-15')

  const currentWeekIndex = Math.min(
    Math.max(
      differenceInCalendarWeeks(today, programStart, { weekStartsOn: 1 }) + 1,
      1
    ),
    4
  )

  const [selectedWeek, setSelectedWeek] = useState(`week-${currentWeekIndex}`)

  if (activeEnrollmentQuery?.isLoading || enrollmentsQuery?.isLoading) {
    return <div>Загрузка...</div>
  }

  if (!courseId) {
    return <div>Нет активных курсов</div>
  }

  return (
    <div className="flex flex-col gap-4 font-bold w-full">
      {/* Селектор курса */}
      <CourseSelector
        enrollments={enrollments}
        selectedEnrollmentId={selectedEnrollmentId}
        onEnrollmentChange={setSelectedEnrollmentId}
      />

      <h3>{format(today, 'LLLL', { locale: ru })}</h3>
      <Tabs
        value={selectedWeek}
        onValueChange={setSelectedWeek}
        className="space-y-4"
      >
        <TabsList className="rounded-lg bg-muted p-1 grid grid-cols-4">
          {WEEKS.map(w => (
            <TabsTrigger
              key={w}
              value={`week-${w}`}
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >
              Неделя {w}
            </TabsTrigger>
          ))}
        </TabsList>

        {WEEKS.map(w => (
          <TabsContent key={w} value={`week-${w}`}>
            <DayTabs
              weekNumber={w}
              programStart={programStart}
              currentDate={today}
              courseId={courseId}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
