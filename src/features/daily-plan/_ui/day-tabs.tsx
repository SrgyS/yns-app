import { useMemo, useState } from 'react'
import {
  addDays,
  format,
  startOfWeek,
  isBefore,
  differenceInDays,
  startOfDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { Dumbbell } from 'lucide-react'
import { DAYS_ORDER } from '../constant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { WarmUp } from './warm-up'
import { useDailyPlan } from '../_vm/use-daily-plan'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { DayOfWeek } from '@prisma/client'
import { DAY_LABELS } from '@/features/select-training-days/constants'

export function DayTabs({
  weekNumber,
  programStart,
  currentDate,
  courseId,
}: {
  weekNumber: number
  programStart: Date
  currentDate: Date
  courseId: string
}) {
  const { getDailyPlan } = useDailyPlan()
  const { data: session } = useAppSession()
  const { getEnrollment } = useCourseEnrollment()

  const enrollmentQuery = getEnrollment(session?.user?.id || '', courseId)

  // Вычисляем начало недели
  // Вычисляем смещение от даты начала программы
  const weekStart = useMemo(() => {
    return addDays(programStart, (weekNumber - 1) * 7)
  }, [weekNumber, programStart])

  // Получаем выбранные дни тренировок из активной записи
  const enrollment = enrollmentQuery?.data

  // Оптимизируем получение selectedWorkoutDays с помощью useMemo
  const selectedWorkoutDays = useMemo(() => {
    return enrollment?.selectedWorkoutDays || []
  }, [enrollment?.selectedWorkoutDays])

  // Преобразуем DayOfWeek в индексы дней недели (0-6, где 0 - понедельник)
  const workoutDayIndices = useMemo(() => {
    return selectedWorkoutDays
      .map(day => {
        return DAYS_ORDER.indexOf(day)
      })
      .filter(index => index !== -1)
  }, [selectedWorkoutDays])

  // Вычисляем общее количество дней программы
  const totalProgramDays = useMemo(() => {
    const durationWeeks = enrollment?.course?.durationWeeks ?? 4
    return durationWeeks * 7
  }, [enrollment?.course?.durationWeeks])

  const days = useMemo(() => {
    // Определяем начало недели для отображения дней
    const weekStartForDays = startOfWeek(weekStart, { weekStartsOn: 1 })

    return DAYS_ORDER.map((dayOfWeek, i) => {
      const date = addDays(weekStartForDays, i)

      // Проверяем, находится ли день до даты покупки
      // Используем строгое сравнение, чтобы день начала программы был активен
      const isBeforePurchase =
        isBefore(date, programStart) &&
        format(date, 'yyyy-MM-dd') !== format(programStart, 'yyyy-MM-dd')

      // Нормализуем даты, чтобы избежать проблем с часовыми поясами
      const normalizedDate = startOfDay(date)
      const normalizedProgramStart = startOfDay(programStart)

      // Вычисляем день программы (от 1 до 28)
      const daysSinceProgramStart =
        differenceInDays(normalizedDate, normalizedProgramStart) + 1

      // Проверяем, находится ли день после 28-го дня программы
      const isAfterProgram = daysSinceProgramStart > totalProgramDays

      // Проверяем, является ли день тренировочным
      // Определяем день недели (0 - понедельник, 6 - воскресенье)
      const dayOfWeekIndex = (date.getDay() + 6) % 7 // Преобразуем из JS формата (0 - воскресенье) в наш формат (0 - понедельник)

      // Проверяем, входит ли индекс дня недели в список тренировочных дней
      const isWorkoutDay = workoutDayIndices.some(
        index => index === dayOfWeekIndex
      )

      // Отключаем дни до даты начала программы и после окончания программы
      const isDisabled = isBeforePurchase || isAfterProgram

      // Вычисляем номер дня программы (только для дней в рамках программы)
      const programDay =
        daysSinceProgramStart > 0 && daysSinceProgramStart <= totalProgramDays
          ? daysSinceProgramStart
          : null

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
  }, [weekStart, currentDate, programStart, workoutDayIndices])

  // Находим первый активный день в неделе
  const firstActiveDay = days.find(d => !d.isDisabled)?.key || DayOfWeek.MONDAY
  // Находим сегодняшний день, если он есть в текущей неделе и не отключен
  const todayActiveDay = days.find(d => d.isToday && !d.isDisabled)?.key
  // Приоритет: сначала сегодняшний активный день, затем первый активный день недели
  const defaultDayKey = todayActiveDay || firstActiveDay
  const [selectedDay, setSelectedDay] = useState<string>(defaultDayKey)

  const selectedDayNumberInCourse = useMemo(() => {
    return days.find(d => d.key === selectedDay)?.programDay
  }, [selectedDay, days])

  // Всегда вызываем getDailyPlan, но с разными параметрами
  const dailyPlanQuery = getDailyPlan(
    courseId,
    selectedDayNumberInCourse || 1 // Используем 0 или другое значение по умолчанию
  )

  // В JSX проверяем не только наличие данных, но и selectedDayNumberInCourse
  return (
    <Tabs
      key={`week-${weekNumber}`}
      value={selectedDay}
      onValueChange={setSelectedDay}
      className="space-y-2"
    >
      <TabsList className="flex gap-3 bg-transparent h-auto">
        {days.map(d => (
          <TabsTrigger
            key={d.key}
            value={d.key}
            disabled={d.isDisabled}
            className={`relative rounded-md border border-muted px-2 py-3 text-xs  transition-colors cursor-pointer basis-0 w-full  gap-y-0 grid h-20
              data-[state=active]:bg-primary 
              data-[state=active]:text-primary-foreground 
              data-[state=active]:border-primary 
              ${d.isWorkoutDay && !d.isDisabled ? 'bg-green-50 border-green-200' : ''} 
              ${d.isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {d.isWorkoutDay && !d.isDisabled && (
              <Dumbbell
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-cyan-900/60"
              />
            )}
            <div className="flex items-baseline gap-1 leading-tight">
              <span className="text-lg whitespace-nowrap">{d.label}</span>
              <span className="text-sm whitespace-nowrap">{d.dateStr}</span>
            </div>
            {d.programDay && (
              <span className="text-xs text-muted-foreground leading-none">
                День {d.programDay}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={selectedDay} className="flex flex-col gap-4">
        {dailyPlanQuery?.data ? (
          <>
            {dailyPlanQuery.data.warmupId && (
              <WarmUp
                title="Зарядка"
                workoutId={dailyPlanQuery.data.warmupId}
                enrollmentId={enrollment?.id || ''}
                userDailyPlanId={dailyPlanQuery.data.id}
              />
            )}
            {dailyPlanQuery.data.isWorkoutDay &&
              dailyPlanQuery.data.mainWorkoutId && (
                <WarmUp
                  title="Тренировка"
                  workoutId={dailyPlanQuery.data.mainWorkoutId}
                  enrollmentId={enrollment?.id || ''}
                  userDailyPlanId={dailyPlanQuery.data.id}
                />
              )}
          </>
        ) : (
          <>Нет тренировки</>
        )}
      </TabsContent>
    </Tabs>
  )
}
