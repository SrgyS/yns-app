'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
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
import { Button } from '@/shared/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MemoizedDayTabs = memo(DayTabs)

export function CalendarTabs({ courseSlug }: { courseSlug: CourseSlug }) {
  const today = useMemo(() => new Date(), [])
  const { data: session } = useAppSession()
  const { getEnrollmentByCourseSlug } = useCourseEnrollment()

  const enrollmentQuery = getEnrollmentByCourseSlug(
    session?.user?.id || '',
    courseSlug
  )

  const enrollment = enrollmentQuery.data
  const programStart = useMemo(() => {
    const start = enrollment?.startDate
    return start ? new Date(start) : null
  }, [enrollment?.startDate])

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

  const defaultWeek = currentWeekIndex
  const [activeWeekNumber, setActiveWeekNumber] = useState(defaultWeek)
  const [activeDate, setActiveDate] = useState(() => today)

  useEffect(() => {
    setActiveWeekNumber(defaultWeek)
  }, [defaultWeek])

  const handleDayChange = useCallback((date: Date) => {
    setActiveDate(prev => {
      if (prev && isSameDay(prev, date)) {
        return prev
      }
      return date
    })
  }, [])
  const getDisplayWeekStart = useCallback(
    (week: number) => {
      if (isSubscription) {
        const meta = weeksMeta?.find(m => m.weekNumber === week)
        const releaseDate = meta ? new Date(meta.releaseAt) : today
        return startOfWeek(releaseDate, { weekStartsOn: 1 })
      }
      // Фиксированный курс: неделя относительно начала записи
      const base = startOfWeek(programStart!, { weekStartsOn: 1 })
      return addDays(base, (week - 1) * 7)
    },
    [isSubscription, weeksMeta, today, programStart]
  )

  const getWeekLabel = useCallback(
    (week: number) => {
      if (isSubscription) {
        const weekStart = getDisplayWeekStart(week)
        const weekInMonth = getWeekOfMonth(weekStart)
        return `${weekInMonth} неделя`
      }
      return `${week} неделя`
    },
    [getDisplayWeekStart, isSubscription]
  )

  const availableWeeksNumbers = useMemo(() => {
    return [...availableWeeks].sort((a, b) => a - b)
  }, [availableWeeks])

  const weekMeta = useMemo(() => {
    return new Map(
      availableWeeksNumbers.map(week => {
        const displayStart = getDisplayWeekStart(week)
        const label = getWeekLabel(week)
        return [week, { displayStart, label }] as const
      })
    )
  }, [availableWeeksNumbers, getDisplayWeekStart, getWeekLabel])

  const getWeekMeta = useCallback(
    (week: number) => weekMeta.get(week),
    [weekMeta]
  )

  useEffect(() => {
    if (!availableWeeksNumbers.includes(activeWeekNumber)) {
      const firstWeek = availableWeeksNumbers[0]
      if (firstWeek) {
        setActiveWeekNumber(firstWeek)
      }
    }
  }, [activeWeekNumber, availableWeeksNumbers])

  const activeWeekIndex = useMemo(() => {
    const idx = availableWeeksNumbers.findIndex(w => w === activeWeekNumber)
    return idx === -1 ? 0 : idx
  }, [activeWeekNumber, availableWeeksNumbers])

  const currentWeekNumber =
    availableWeeksNumbers[activeWeekIndex] ??
    availableWeeksNumbers[0] ??
    currentWeekIndex

  const shiftWeek = useCallback(
    (offset: number) => {
      const targetIndex = activeWeekIndex + offset
      if (targetIndex < 0 || targetIndex >= availableWeeksNumbers.length) return
      const nextWeek = availableWeeksNumbers[targetIndex]
      if (nextWeek) {
        setActiveWeekNumber(nextWeek)
      }
    },
    [activeWeekIndex, availableWeeksNumbers]
  )

  const handlePrevWeek = useCallback(() => {
    shiftWeek(-1)
  }, [shiftWeek])

  const handleNextWeek = useCallback(() => {
    shiftWeek(1)
  }, [shiftWeek])

  const weeksCount = availableWeeks.length
  const isCompactWeeks = weeksCount > 5

  const getWeekLabelSafe = useCallback(
    (week: number) => getWeekMeta(week)?.label ?? getWeekLabel(week),
    [getWeekMeta, getWeekLabel]
  )

  const getDisplayWeekStartSafe = useCallback(
    (week: number) =>
      getWeekMeta(week)?.displayStart ?? getDisplayWeekStart(week),
    [getWeekMeta, getDisplayWeekStart]
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

  const renderCompactNavigation = () => (
    <>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2 py-1 sm:px-3 sm:py-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevWeek}
            disabled={activeWeekIndex <= 0}
            aria-label="Предыдущая неделя"
            className="size-8 sm:size-9"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="rounded-md bg-background px-3 py-1 text-sm font-medium sm:text-base">
            {getWeekLabelSafe(currentWeekNumber)}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextWeek}
            disabled={activeWeekIndex >= availableWeeksNumbers.length - 1}
            aria-label="Следующая неделя"
            className="size-8 sm:size-9"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <span className="text-[11px] text-muted-foreground sm:text-sm">
          Всего недель: {weeksCount}
        </span>
      </div>
      <TabsList className="sr-only" aria-hidden="true">
        {availableWeeksNumbers.map(week => (
          <TabsTrigger key={`compact-${week}`} value={`week-${week}`}>
            {getWeekLabelSafe(week)}
          </TabsTrigger>
        ))}
      </TabsList>
    </>
  )

  const renderScrollableNavigation = () => (
    <TabsList className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-lg bg-muted pl-1 pr-1 pt-1 pb-1 text-[11px] sm:text-sm justify-start">
      {availableWeeksNumbers.map(week => (
        <TabsTrigger
          key={`list-${week}`}
          value={`week-${week}`}
          className={cn(
            'whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] transition-colors sm:px-3 sm:py-2 sm:text-sm flex-none',
            'data-[state=active]:bg-background data-[state=active]:shadow-sm',
            'max-[380px]:px-2 max-[380px]:py-1.25 max-[380px]:text-[10px]'
          )}
        >
          {getWeekLabelSafe(week)}
        </TabsTrigger>
      ))}
    </TabsList>
  )

  return (
    <div className="flex w-full flex-col gap-2.5 font-medium">
      <h3 className="text-sm font-semibold capitalize text-muted-foreground sm:text-lg">
        {format(activeDate, 'LLLL', { locale: ru })}
      </h3>
      <Tabs
        value={`week-${activeWeekNumber}`}
        onValueChange={value =>
          setActiveWeekNumber(Number(value.replace('week-', '')))
        }
        className="space-y-2.5"
      >
        {isCompactWeeks ? renderCompactNavigation() : renderScrollableNavigation()}

        {availableWeeksNumbers.map(week => (
          <TabsContent key={`week-${week}`} value={`week-${week}`}>
            {activeWeekNumber === week ? (
              <MemoizedDayTabs
                weekNumber={week}
                displayWeekStart={getDisplayWeekStartSafe(week)}
                enrollmentStart={programStart!}
                currentDate={today}
                courseId={courseId}
                isSubscription={isSubscription}
                totalWeeks={totalWeeks}
                availableWeeks={availableWeeksNumbers}
                maxDayNumber={maxDayNumber ?? undefined}
                onDayChange={handleDayChange}
                isActiveWeek
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
