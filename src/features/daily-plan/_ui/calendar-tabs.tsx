'use client'

import { format, startOfWeek, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { DayTabs } from './day-tabs'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCalendar } from '../_vm/use-worckout-calendar'
import { CourseSlug } from '@/kernel/domain/course'
import { getWeekOfMonth } from 'date-fns'

export function CalendarTabs({ courseSlug }: { courseSlug: CourseSlug }) {
  const today = new Date()
  const { data: session } = useAppSession()
  const { getEnrollmentByCourseSlug } = useCourseEnrollment()

  const enrollmentQuery = getEnrollmentByCourseSlug(session?.user?.id || '', courseSlug)

  const enrollment = enrollmentQuery.data
  const programStart = enrollment?.startDate ? new Date(enrollment.startDate) : null

  const durationWeeks = enrollment?.course?.durationWeeks

  const isSubscription = enrollment?.course?.contentType === 'SUBSCRIPTION'

  const { noProgram, availableWeeks, currentWeekIndex, weeksMeta } =
    useWorkoutCalendar(programStart, durationWeeks, courseSlug, isSubscription)

  // Для подписки: если недель нет — явно показываем отсутствие доступных тренировок
  if (isSubscription && enrollment && availableWeeks.length === 0) {
    return <div>Нет доступных тренировок</div>
  }

  if (noProgram || !enrollment || !currentWeekIndex) {
    return <div>Нет активного курса</div>
  }

  const courseId = enrollment.courseId
  const defaultWeek = `week-${currentWeekIndex}`

  const getDisplayWeekStart = (w: number) => {
    if (isSubscription) {
      const meta = weeksMeta?.find(m => m.weekNumber === w)
      const releaseDate = meta ? new Date(meta.releaseAt) : today
      return startOfWeek(releaseDate, { weekStartsOn: 1 })
    }
    // Фиксированный курс: неделя относительно начала записи
    const base = startOfWeek(programStart!, { weekStartsOn: 1 })
    return addDays(base, (w - 1) * 7)
  }

  const getWeekLabel = (w: number) => {
    if (isSubscription) {
      const weekStart = getDisplayWeekStart(w)
      const weekInMonth = getWeekOfMonth(weekStart)
      return `${weekInMonth} неделя`
    }
    return `${w} неделя`
  }

  return (
    <div className="flex flex-col font-medium w-full">
      <h3>{format(today, 'LLLL', { locale: ru })}</h3>
      <Tabs key={defaultWeek} defaultValue={defaultWeek} className="space-y-0">
        <TabsList className={`rounded-lg bg-muted p-1 flex`}>
          {availableWeeks.map(w => {
            return (
              <TabsTrigger
                key={w}
                value={`week-${w}`}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                {getWeekLabel(w)}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {availableWeeks.map(w => (
          <TabsContent key={`week-${w}`} value={`week-${w}`}>
            <DayTabs
              weekNumber={w}
              displayWeekStart={getDisplayWeekStart(w)}
              enrollmentStart={programStart!}
              currentDate={today}
              courseId={courseId}
              isSubscription={isSubscription}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
