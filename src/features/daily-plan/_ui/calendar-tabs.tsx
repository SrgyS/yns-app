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
import { cn } from '@/shared/ui/utils'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export function CalendarTabs({ courseSlug }: { courseSlug: CourseSlug }) {
  const today = new Date()
  const { data: session } = useAppSession()
  const { getEnrollmentByCourseSlug } = useCourseEnrollment()

  const enrollmentQuery = getEnrollmentByCourseSlug(
    session?.user?.id || '',
    courseSlug
  )

  const enrollment = enrollmentQuery.data
  const programStart = enrollment?.startDate
    ? new Date(enrollment.startDate)
    : null

  const durationWeeks = enrollment?.course?.durationWeeks

  const isSubscription = enrollment?.course?.contentType === 'SUBSCRIPTION'

  const {
    noProgram,
    availableWeeks,
    currentWeekIndex,
    weeksMeta,
    totalWeeks,
    maxDayNumber,
    isLoading: isCalendarLoading,
  } = useWorkoutCalendar(
    programStart,
    durationWeeks,
    courseSlug,
    isSubscription
  )

  if (enrollmentQuery.isLoading || isCalendarLoading) {
    return (
      <div className="flex w-full flex-col gap-2.5 font-medium">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
    )
  }

  // Для подписки: если недель нет — явно показываем отсутствие доступных тренировок
  if (isSubscription && enrollment && availableWeeks.length === 0) {
    return <div>Нет доступных тренировок</div>
  }

  if (noProgram || !enrollment || !currentWeekIndex) {
    return <div>Нет доступного курса</div>
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
    <div className="flex w-full flex-col gap-2.5 font-medium">
      <h3 className="text-sm font-semibold capitalize text-muted-foreground sm:text-lg">
        {format(today, 'LLLL', { locale: ru })}
      </h3>
      <Tabs
        key={defaultWeek}
        defaultValue={defaultWeek}
        className="space-y-2.5"
      >
        <TabsList className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-lg bg-muted pl-1 pr-1 pt-1 pb-1 text-[11px] sm:text-sm justify-start">
          {availableWeeks.map(w => {
            return (
              <TabsTrigger
                key={w}
                value={`week-${w}`}
                className={cn(
                  'whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] transition-colors sm:px-3 sm:py-2 sm:text-sm flex-none',
                  'data-[state=active]:bg-background data-[state=active]:shadow-sm',
                  'max-[380px]:px-2 max-[380px]:py-1.25 max-[380px]:text-[10px]'
                )}
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
              totalWeeks={totalWeeks}
              availableWeeks={availableWeeks}
              maxDayNumber={maxDayNumber ?? undefined}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
