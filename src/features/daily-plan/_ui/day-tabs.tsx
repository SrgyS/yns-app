import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  addDays,
  format,
  startOfWeek,
  isBefore,
  differenceInDays,
  startOfDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarCheck } from 'lucide-react'
import { DAYS_ORDER } from '../constant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ExerciseCard } from './exercise-card'
import { useDailyPlanQuery } from '../_vm/use-daily-plan'
import { useEnrollmentQuery } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { DailyContentType, DayOfWeek } from '@/shared/lib/client-enums'
import { DAY_LABELS } from '@/features/select-training-days/constants'
import { cn } from '@/shared/ui/utils'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

type DayTab = {
  key: DayOfWeek
  label: string
  dateStr: string
  date: Date
  isToday: boolean
  isDisabled: boolean
  isWorkoutDay: boolean
  programDay: number | null
}

type DayTabTriggerProps = {
  readonly day: DayTab
  readonly isSubscription: boolean
}

type DayTabsProps = {
  readonly weekNumber: number
  readonly displayWeekStart: Date
  readonly enrollmentStart: Date
  readonly currentDate: Date
  readonly courseId: string
  readonly isSubscription?: boolean
  readonly totalWeeks: number
  readonly availableWeeks: number[]
  readonly maxDayNumber?: number
  readonly onDayChange?: (date: Date) => void
  readonly isActiveWeek?: boolean
}

type DailyPlanView = {
  id: string
  warmupId: string | null
  warmupStepIndex: number
  isWorkoutDay: boolean
  mainWorkouts: Array<{
    order: number
    workoutId: string
    stepIndex: number
  }>
}

const DAY_INDEX_BY_WEEKDAY: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return format(left, 'yyyy-MM-dd') === format(right, 'yyyy-MM-dd')
}

function resolveAllowedWeeks(
  availableWeeks: number[],
  totalWeeks: number
): number[] {
  if (availableWeeks.length > 0) {
    return availableWeeks
  }

  if (totalWeeks > 0) {
    return Array.from({ length: totalWeeks }, (_, i) => i + 1)
  }

  return []
}

function resolveIsDisabled(params: {
  isWeekUnavailable: boolean
  isSubscription: boolean
  isBeforePurchase: boolean
  isAfterProgram: boolean
}): boolean {
  const { isWeekUnavailable, isSubscription, isBeforePurchase, isAfterProgram } =
    params

  if (isWeekUnavailable) {
    return true
  }

  if (isSubscription) {
    return isAfterProgram
  }

  return isBeforePurchase || isAfterProgram
}

function buildDayTabs(params: {
  weekStart: Date
  currentDate: Date
  effectiveEnrollmentStart: Date
  workoutDayIndices: number[]
  totalProgramDays: number
  isSubscription: boolean
  allowedWeeksSet: Set<number>
  weekNumber: number
}): DayTab[] {
  const {
    weekStart,
    currentDate,
    effectiveEnrollmentStart,
    workoutDayIndices,
    totalProgramDays,
    isSubscription,
    allowedWeeksSet,
    weekNumber,
  } = params

  const weekStartForDays = startOfWeek(weekStart, { weekStartsOn: 1 })

  return DAYS_ORDER.map((dayOfWeek, i) => {
    const date = addDays(weekStartForDays, i)
    const isBeforePurchase =
      isBefore(date, effectiveEnrollmentStart) &&
      !isSameCalendarDay(date, effectiveEnrollmentStart)

    const normalizedDate = startOfDay(date)
    const normalizedProgramStart = startOfDay(effectiveEnrollmentStart)
    const daysSinceProgramStart =
      differenceInDays(normalizedDate, normalizedProgramStart) + 1
    const isAfterProgram =
      totalProgramDays > 0 && daysSinceProgramStart > totalProgramDays
    const isWeekUnavailable = !allowedWeeksSet.has(weekNumber)

    const isDisabled = resolveIsDisabled({
      isWeekUnavailable,
      isSubscription,
      isBeforePurchase,
      isAfterProgram,
    })

    let programDay: number | null = null
    const isInsideProgramRange =
      daysSinceProgramStart > 0 &&
      (totalProgramDays === 0 || daysSinceProgramStart <= totalProgramDays)

    if (isInsideProgramRange) {
      programDay = daysSinceProgramStart
    }

    const dayOfWeekIndex = (date.getDay() + 6) % 7
    const isWorkoutDay = workoutDayIndices.includes(dayOfWeekIndex)

    return {
      key: dayOfWeek,
      label: DAY_LABELS[dayOfWeek],
      dateStr: format(date, 'd', { locale: ru }),
      date,
      isToday: isSameCalendarDay(date, currentDate),
      isDisabled,
      isWorkoutDay,
      programDay,
    }
  })
}

function DayTabTrigger({ day, isSubscription }: Readonly<DayTabTriggerProps>) {
  return (
    <TabsTrigger
      key={day.key}
      value={day.key}
      disabled={day.isDisabled}
      className={cn(
        'snap-sta text-left flex flex-col items-start min-w-13.5 flex-none cursor-pointer content-center justify-items-center gap-y-0 rounded-md border border-muted px-3  py-2   transition-colors sm:min-w-18 sm:text-xs',
        'data-[state=active]:bg-primary/10 data-[state=active]:border-primary dark:data-[state=active]:border-premium data-[state=active]:font-semibold',
        'max-[360px]:min-w-12.5',
        day.isWorkoutDay && !day.isDisabled ? 'bg-muted/40' : '',
        day.isDisabled ? 'cursor-not-allowed opacity-50' : ''
      )}
    >
      <div className="whitespace-nowrap text-xs leading-tight flex mb-1">
        {`${day.label.toUpperCase()} ${day.dateStr}`}
        {day.isWorkoutDay && !day.isDisabled ? (
          <CalendarCheck className="pointer-events-none ml-1 h-2 w-2 text-primary group-data-sm:h-4 sm:w-4" />
        ) : null}
      </div>
      {!isSubscription && day.programDay ? (
        <div className="text-[11px] leading-none sm:text-xs">День {day.programDay}</div>
      ) : null}
    </TabsTrigger>
  )
}

function renderDailyPlanContent(params: {
  isLoading: boolean
  enabled: boolean
  plan: DailyPlanView | undefined
  enrollmentId: string
}): ReactNode {
  const { isLoading, enabled, plan, enrollmentId } = params

  if (isLoading && !plan) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (!enabled || !plan) {
    return <>Нет тренировки</>
  }

  return (
    <>
      {plan.warmupId ? (
        <ExerciseCard
          title="Зарядка"
          workoutId={plan.warmupId}
          enrollmentId={enrollmentId}
          contentType={DailyContentType.WARMUP}
          stepIndex={plan.warmupStepIndex}
        />
      ) : null}
      {plan.isWorkoutDay && plan.mainWorkouts.length > 0
        ? plan.mainWorkouts.map(main => (
            <ExerciseCard
              key={`${plan.id ?? 'plan'}-${main.order}`}
              title="Тренировка"
              workoutId={main.workoutId}
              enrollmentId={enrollmentId}
              contentType={DailyContentType.MAIN}
              stepIndex={main.stepIndex}
            />
          ))
        : null}
    </>
  )
}

export function DayTabs({
  weekNumber,
  displayWeekStart,
  enrollmentStart,
  currentDate,
  courseId,
  isSubscription,
  totalWeeks,
  availableWeeks,
  maxDayNumber,
  onDayChange,
  isActiveWeek = false,
}: Readonly<DayTabsProps>) {
  const { data: session } = useAppSession()
  const enrollmentQuery = useEnrollmentQuery(session?.user?.id || '', courseId)
  const tabsListRef = useRef<HTMLDivElement | null>(null)

  const weekStart = useMemo(() => displayWeekStart, [displayWeekStart])

  const enrollment = enrollmentQuery?.data
  const enrollmentId = enrollment?.id || ''

  const allowedWeeksArray = useMemo(
    () => resolveAllowedWeeks(availableWeeks, totalWeeks),
    [availableWeeks, totalWeeks]
  )

  const allowedWeeksSet = useMemo(
    () => new Set(allowedWeeksArray),
    [allowedWeeksArray]
  )

  const maxAllowedWeek = useMemo(() => {
    if (allowedWeeksArray.length === 0) {
      return 0
    }
    return Math.max(...allowedWeeksArray)
  }, [allowedWeeksArray])

  const totalProgramDays = useMemo(() => {
    if (maxDayNumber && maxDayNumber > 0) {
      return maxDayNumber
    }
    return maxAllowedWeek * 7
  }, [maxAllowedWeek, maxDayNumber])

  const effectiveEnrollmentStart = useMemo(() => {
    if (isSubscription) {
      return startOfWeek(enrollmentStart, { weekStartsOn: 1 })
    }
    return enrollmentStart
  }, [isSubscription, enrollmentStart])

  const selectedWorkoutDays = useMemo(
    () => enrollment?.selectedWorkoutDays || [],
    [enrollment?.selectedWorkoutDays]
  )

  const workoutDayIndices = useMemo(
    () =>
      selectedWorkoutDays
        .map(day => DAY_INDEX_BY_WEEKDAY[day])
        .filter((index): index is number => typeof index === 'number'),
    [selectedWorkoutDays]
  )

  const days = useMemo(
    () =>
      buildDayTabs({
        weekStart,
        currentDate,
        effectiveEnrollmentStart,
        workoutDayIndices,
        totalProgramDays,
        isSubscription: Boolean(isSubscription),
        allowedWeeksSet,
        weekNumber,
      }),
    [
      weekStart,
      currentDate,
      effectiveEnrollmentStart,
      workoutDayIndices,
      totalProgramDays,
      isSubscription,
      allowedWeeksSet,
      weekNumber,
    ]
  )

  const firstActiveDay = days.find(d => !d.isDisabled)?.key || DayOfWeek.MONDAY
  const todayActiveDay = days.find(d => d.isToday && !d.isDisabled)?.key
  const defaultDayKey = todayActiveDay || firstActiveDay
  const [selectedDay, setSelectedDay] = useState<string>(defaultDayKey)

  const selectedDayNumberInCourse = useMemo(
    () => days.find(d => d.key === selectedDay)?.programDay ?? null,
    [days, selectedDay]
  )

  const selectedDayDate = useMemo(
    () => days.find(d => d.key === selectedDay)?.date ?? null,
    [days, selectedDay]
  )

  useEffect(() => {
    if (!isActiveWeek) {
      return
    }

    if (onDayChange && selectedDayDate) {
      onDayChange(selectedDayDate)
    }
  }, [isActiveWeek, onDayChange, selectedDayDate])

  const enabled =
    !!selectedDayNumberInCourse &&
    selectedDayNumberInCourse > 0 &&
    (totalProgramDays === 0 || selectedDayNumberInCourse <= totalProgramDays)

  const shouldFetchDailyPlan = Boolean(enrollmentId && enrollment && enabled)

  const dailyPlanQuery = useDailyPlanQuery(
    enrollmentId || '',
    courseId,
    selectedDayNumberInCourse || 1,
    shouldFetchDailyPlan
  )

  return (
    <Tabs
      value={selectedDay}
      onValueChange={setSelectedDay}
      className="space-y-2.5"
    >
      <TabsList
        ref={tabsListRef}
        className="flex h-auto w-full gap-1.5 overflow-x-auto bg-transparent pl-0 pr-0 pb-2.5 justify-start sm:gap-3"
      >
        {days.map(day => (
          <DayTabTrigger
            key={day.key}
            day={day}
            isSubscription={Boolean(isSubscription)}
          />
        ))}
      </TabsList>
      <TabsContent value={selectedDay} className="flex flex-col gap-4 sm:gap-5">
        {renderDailyPlanContent({
          isLoading: dailyPlanQuery.isLoading,
          enabled,
          plan: dailyPlanQuery.data as DailyPlanView | undefined,
          enrollmentId,
        })}
      </TabsContent>
    </Tabs>
  )
}
