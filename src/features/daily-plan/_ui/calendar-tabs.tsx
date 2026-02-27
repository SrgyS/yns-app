'use client'

import { memo, useState } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  getWeekOfMonth,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { DayTabs } from './day-tabs'
import { useEnrollmentByCourseSlugQuery } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCalendar } from '../_vm/use-worckout-calendar'
import { CourseSlug } from '@/kernel/domain/course'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

const MemoizedDayTabs = memo(DayTabs)

export function CalendarTabs({
  courseSlug,
}: Readonly<{ courseSlug: CourseSlug }>) {
  const today = new Date()
  const { data: session } = useAppSession()
  const enrollmentQuery = useEnrollmentByCourseSlugQuery(
    session?.user?.id || '',
    courseSlug
  )

  const enrollment = enrollmentQuery.data
  const programStart = (() => {
    const start = enrollment?.startDate
    return start ? new Date(start) : null
  })()

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

  const [weekSelection, setWeekSelection] = useState({
    sourceWeek: currentWeekIndex,
    activeWeek: currentWeekIndex,
  })
  const [activeDate, setActiveDate] = useState(() => today)

  const activeWeekNumber =
    weekSelection.sourceWeek === currentWeekIndex
      ? weekSelection.activeWeek
      : currentWeekIndex

  const setActiveWeekNumber = (week: number) => {
    setWeekSelection({
      sourceWeek: currentWeekIndex,
      activeWeek: week,
    })
  }

  const handleDayChange = (date: Date) => {
    setActiveDate(prev => {
      if (prev && isSameDay(prev, date)) {
        return prev
      }
      return date
    })
  }

  const getDisplayWeekStart = (week: number) => {
    if (isSubscription) {
      const meta = weeksMeta?.find(m => m.weekNumber === week)
      const releaseDate = meta ? new Date(meta.releaseAt) : today
      return startOfWeek(releaseDate, { weekStartsOn: 1 })
    }
    // Фиксированный курс: неделя относительно начала записи
    const base = startOfWeek(programStart!, { weekStartsOn: 1 })
    return addDays(base, (week - 1) * 7)
  }

  const getWeekLabel = (week: number) => {
    if (isSubscription) {
      const weekStart = getDisplayWeekStart(week)
      const weekInMonth = getWeekOfMonth(weekStart)
      return `${weekInMonth} неделя`
    }
    return `${week} неделя`
  }

  const availableWeeksNumbers = [...availableWeeks].sort((a, b) => a - b)
  const fallbackWeekNumber = availableWeeksNumbers[0] ?? currentWeekIndex
  const resolvedActiveWeekNumber = availableWeeksNumbers.includes(activeWeekNumber)
    ? activeWeekNumber
    : fallbackWeekNumber

  const weekMeta = new Map(
    availableWeeksNumbers.map(week => {
      const displayStart = getDisplayWeekStart(week)
      const label = getWeekLabel(week)
      return [week, { displayStart, label }] as const
    })
  )

  const getWeekMeta = (week: number) => weekMeta.get(week)

  const activeWeekIndex = (() => {
    const idx = availableWeeksNumbers.findIndex(
      week => week === resolvedActiveWeekNumber
    )
    return idx === -1 ? 0 : idx
  })()

  const currentWeekNumber =
    availableWeeksNumbers[activeWeekIndex] ?? fallbackWeekNumber

  const shiftWeek = (offset: number) => {
    const targetIndex = activeWeekIndex + offset
    if (targetIndex < 0 || targetIndex >= availableWeeksNumbers.length) return
    const nextWeek = availableWeeksNumbers[targetIndex]
    if (nextWeek) {
      setActiveWeekNumber(nextWeek)
    }
  }

  const handlePrevWeek = () => {
    shiftWeek(-1)
  }

  const handleNextWeek = () => {
    shiftWeek(1)
  }

  const weeksCount = availableWeeks.length

  const getWeekLabelSafe = (week: number) =>
    getWeekMeta(week)?.label ?? getWeekLabel(week)

  const getDisplayWeekStartSafe = (week: number) =>
    getWeekMeta(week)?.displayStart ?? getDisplayWeekStart(week)

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

  if (noProgram || !enrollment) {
    return <div>Нет доступного курса</div>
  }

  if (!currentWeekIndex) {
    return <div>Нет доступных тренировок</div>
  }

  const courseId = enrollment.courseId

  return (
    <Tabs
      value={`week-${resolvedActiveWeekNumber}`}
      onValueChange={value =>
        setActiveWeekNumber(Number(value.replace('week-', '')))
      }
      className="space-y-2.5 gap-1.5"
    >
      <div className="flex w-full items-center sm:gap-2 rounded-lg bg-muted px-2 py-1  justify-between sm:px-3 sm:py-2">
        <div className="flex items-center gap-2 sm:gap-2">
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
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[130px] justify-between"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {getWeekLabelSafe(currentWeekNumber)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-72 overflow-auto min-w-[130px]"
            >
              <DropdownMenuRadioGroup
                value={String(currentWeekNumber)}
                onValueChange={value => {
                  const parsed = Number(value)
                  if (!Number.isNaN(parsed)) {
                    setActiveWeekNumber(parsed)
                  }
                }}
              >
                {availableWeeksNumbers.map(week => (
                  <DropdownMenuRadioItem
                    key={`compact-${week}`}
                    value={String(week)}
                    className="text-sm"
                  >
                    {getWeekLabelSafe(week)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <span className="text-muted-foreground text-sm min-w-0 whitespace-normal">
          Всего недель: {weeksCount}
        </span>
      </div>
      <h3 className="text-sm mb-0 font-semibold capitalize">
        {format(activeDate, 'LLLL', { locale: ru })}
      </h3>
      <TabsList
        className="sr-only m-0 h-px w-px p-0 border-0 shadow-none"
        aria-hidden="true"
      >
        {availableWeeksNumbers.map(week => (
          <TabsTrigger key={`compact-${week}`} value={`week-${week}`}>
            {getWeekLabelSafe(week)}
          </TabsTrigger>
        ))}
      </TabsList>

      {availableWeeksNumbers.map(week => (
        <TabsContent key={`week-${week}`} value={`week-${week}`}>
          {resolvedActiveWeekNumber === week ? (
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
  )
}
