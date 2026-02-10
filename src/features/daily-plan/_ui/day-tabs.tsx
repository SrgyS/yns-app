import { useEffect, useMemo, useRef, useState } from 'react'
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
import { DailyContentType, DayOfWeek } from '@prisma/client'
import { DAY_LABELS } from '@/features/select-training-days/constants'
import { cn } from '@/shared/ui/utils'

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
}: {
  weekNumber: number
  displayWeekStart: Date
  enrollmentStart: Date
  currentDate: Date
  courseId: string
  isSubscription?: boolean
  totalWeeks: number
  availableWeeks: number[]
  maxDayNumber?: number
  onDayChange?: (date: Date) => void
  isActiveWeek?: boolean
}) {
  // Removed destructuring of getDailyPlan
  const { data: session } = useAppSession()
  // Removed useCourseEnrollment destructuring

  const enrollmentQuery = useEnrollmentQuery(session?.user?.id || '', courseId)
  const tabsListRef = useRef<HTMLDivElement | null>(null)
  // const hasResetScrollRef = useRef(false)

  // Начало недели для отображения (визуальная неделя)
  const weekStart = useMemo(() => {
    return displayWeekStart
  }, [displayWeekStart])

  const enrollment = enrollmentQuery?.data
  const enrollmentId = enrollment?.id || ''

  const allowedWeeksArray = useMemo(() => {
    if (availableWeeks && availableWeeks.length > 0) {
      return availableWeeks
    }
    if (totalWeeks && totalWeeks > 0) {
      return Array.from({ length: totalWeeks }, (_, i) => i + 1)
    }
    return [] as number[]
  }, [availableWeeks, totalWeeks])

  const allowedWeeksSet = useMemo(() => {
    return new Set(allowedWeeksArray)
  }, [allowedWeeksArray])

  const maxAllowedWeek = useMemo(() => {
    return allowedWeeksArray.length > 0 ? Math.max(...allowedWeeksArray) : 0
  }, [allowedWeeksArray])

  const totalProgramDays = useMemo(() => {
    return maxDayNumber && maxDayNumber > 0 ? maxDayNumber : maxAllowedWeek * 7
  }, [maxAllowedWeek, maxDayNumber])

  // Для подписки базой для расчёта является понедельник недели покупки
  const effectiveEnrollmentStart = useMemo(() => {
    return isSubscription
      ? startOfWeek(enrollmentStart, { weekStartsOn: 1 })
      : enrollmentStart
  }, [isSubscription, enrollmentStart])

  const selectedWorkoutDays = useMemo(() => {
    return enrollment?.selectedWorkoutDays || []
  }, [enrollment?.selectedWorkoutDays])

  const workoutDayIndices = useMemo(() => {
    return selectedWorkoutDays
      .map(day => DAYS_ORDER.indexOf(day))
      .filter(index => index !== -1)
  }, [selectedWorkoutDays])

  const days = useMemo(() => {
    // Определяем начало недели для отображения дней
    const weekStartForDays = startOfWeek(weekStart, { weekStartsOn: 1 })

    return DAYS_ORDER.map((dayOfWeek, i) => {
      const date = addDays(weekStartForDays, i)

      // Проверяем, находится ли день до даты покупки/эффективного старта
      // Используем строгое сравнение, чтобы день начала программы был активен
      const isBeforePurchase =
        isBefore(date, effectiveEnrollmentStart) &&
        format(date, 'yyyy-MM-dd') !==
          format(effectiveEnrollmentStart, 'yyyy-MM-dd')

      // Нормализуем даты, чтобы избежать проблем с часовыми поясами
      const normalizedDate = startOfDay(date)
      const normalizedProgramStart = startOfDay(effectiveEnrollmentStart)

      // Вычисляем день программы (от 1 до N) относительно эффективного старта
      const daysSinceProgramStart =
        differenceInDays(normalizedDate, normalizedProgramStart) + 1

      // Проверяем, находится ли день после окончания программы
      const isAfterProgram =
        totalProgramDays > 0 && daysSinceProgramStart > totalProgramDays

      const isWeekUnavailable = !allowedWeeksSet.has(weekNumber)

      // Отключаем дни:
      // - для подписки: дни из недоступных недель или за пределами сгенерированного плана
      // - для фиксированного курса: до покупки и за пределами разрешённого диапазона
      const isDisabled = isWeekUnavailable
        ? true
        : isSubscription
          ? isAfterProgram
          : isBeforePurchase || isAfterProgram

      // Вычисляем номер дня программы (только для дней в рамках программы)
      const programDay =
        daysSinceProgramStart > 0 &&
        (totalProgramDays === 0 || daysSinceProgramStart <= totalProgramDays)
          ? daysSinceProgramStart
          : null

      const dayOfWeekIndex = (date.getDay() + 6) % 7
      const isWorkoutDay = workoutDayIndices.some(
        index => index === dayOfWeekIndex
      )

      return {
        key: dayOfWeek,
        label: DAY_LABELS[dayOfWeek],
        dateStr: format(date, 'd', { locale: ru }),
        date,
        isToday:
          format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
        isDisabled,
        isWorkoutDay,
        programDay,
      }
    })
  }, [
    weekStart,
    currentDate,
    effectiveEnrollmentStart,
    workoutDayIndices,
    totalProgramDays,
    isSubscription,
    allowedWeeksSet,
    weekNumber,
  ])

  // Находим первый активный день в неделе
  const firstActiveDay = days.find(d => !d.isDisabled)?.key || DayOfWeek.MONDAY
  // Находим сегодняшний день, если он есть в текущей неделе и не отключен
  const todayActiveDay = days.find(d => d.isToday && !d.isDisabled)?.key
  // Приоритет: сначала сегодняшний активный день, затем первый активный день недели
  const defaultDayKey = todayActiveDay || firstActiveDay
  const [selectedDay, setSelectedDay] = useState<string>(defaultDayKey)

  const selectedDayNumberInCourse = useMemo(() => {
    return days.find(d => d.key === selectedDay)?.programDay ?? null
  }, [days, selectedDay])

  const selectedDayDate = useMemo(() => {
    return days.find(d => d.key === selectedDay)?.date ?? null
  }, [days, selectedDay])

  useEffect(() => {
    if (!isActiveWeek) return
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
      key={`week-${weekNumber}`}
      value={selectedDay}
      onValueChange={setSelectedDay}
      className="space-y-2.5"
    >
      <TabsList
        ref={tabsListRef}
        className="flex h-auto w-full gap-1.5 overflow-x-auto bg-transparent pl-0 pr-0 pb-2.5 justify-start sm:gap-3"
      >
        {days.map(d => (
          <TabsTrigger
            key={d.key}
            value={d.key}
            disabled={d.isDisabled}
            className={cn(
              'snap-sta text-left flex flex-col items-start min-w-[54px] flex-none cursor-pointer content-center justify-items-center gap-y-0 rounded-md border border-muted px-3  py-2   transition-colors sm:min-w-[72px] sm:text-xs',
              'data-[state=active]:bg-primary/10 data-[state=active]:border-primary dark:data-[state=active]:border-premium data-[state=active]:font-semibold',
              'max-[360px]:min-w-[50px]',
              d.isWorkoutDay && !d.isDisabled ? 'bg-muted/40' : '',
              d.isDisabled ? 'cursor-not-allowed opacity-50' : ''
            )}
          >
            <div className="whitespace-nowrap text-xs leading-tight flex mb-1">
              {`${d.label.toUpperCase()} ${d.dateStr}`}
              {d.isWorkoutDay && !d.isDisabled && (
                <CalendarCheck className="pointer-events-none ml-1 h-2 w-2 text-primary group-data-sm:h-4 sm:w-4" />
              )}
            </div>
            {!isSubscription && d.programDay && (
              <div className="text-[11px] leading-none sm:text-xs">
                День {d.programDay}
              </div>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={selectedDay} className="flex flex-col gap-4 sm:gap-5">
        {dailyPlanQuery.isLoading ? null : enabled && dailyPlanQuery?.data ? (
          <>
            {dailyPlanQuery.data.warmupId && (
              <ExerciseCard
                title="Зарядка"
                workoutId={dailyPlanQuery.data.warmupId}
                enrollmentId={enrollment?.id || ''}
                userDailyPlanId={dailyPlanQuery.data.id}
                contentType={DailyContentType.WARMUP}
                stepIndex={dailyPlanQuery.data.warmupStepIndex}
              />
            )}
            {dailyPlanQuery.data?.isWorkoutDay &&
              dailyPlanQuery.data?.mainWorkouts?.length ? (
                dailyPlanQuery.data.mainWorkouts.map(main => (
                  <ExerciseCard
                    key={`${dailyPlanQuery.data?.id ?? 'plan'}-${main.order}`}
                    title="Тренировка"
                    workoutId={main.workoutId}
                    enrollmentId={enrollment?.id || ''}
                    userDailyPlanId={dailyPlanQuery.data?.id ?? ''}
                    contentType={DailyContentType.MAIN}
                    stepIndex={main.stepIndex}
                  />
                ))
              ) : null}
          </>
        ) : (
          <>Нет тренировки</>
        )}
      </TabsContent>
    </Tabs>
  )
}
