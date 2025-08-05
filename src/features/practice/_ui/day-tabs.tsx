import { useMemo, useState } from 'react'
import { addDays, format, startOfWeek, isBefore, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { DAY_KEYS } from '../constant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { WarmUp } from './warm-up'
import { useDailyPlan } from '../_vm/use-daily-plan'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { DayOfWeek } from '@prisma/client'

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
  const { getActiveEnrollment } = useCourseEnrollment()
  
  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')

  // Вычисляем начало недели
  // Вычисляем смещение от даты начала программы
  const weekStart = useMemo(() => {
    return addDays(programStart, (weekNumber - 1) * 7);
  }, [weekNumber, programStart])

  // Получаем выбранные дни тренировок из активной записи
  const enrollment = activeEnrollmentQuery?.data
  
  // Оптимизируем получение selectedWorkoutDays с помощью useMemo
  const selectedWorkoutDays = useMemo(() => {
    return enrollment?.selectedWorkoutDays || [];
  }, [enrollment?.selectedWorkoutDays]);
  
  // Преобразуем DayOfWeek в индексы дней недели (0-6, где 0 - понедельник)
  const workoutDayIndices = useMemo(() => {
    return selectedWorkoutDays.map(day => {
      switch(day) {
        case DayOfWeek.MONDAY: return 0;
        case DayOfWeek.TUESDAY: return 1;
        case DayOfWeek.WEDNESDAY: return 2;
        case DayOfWeek.THURSDAY: return 3;
        case DayOfWeek.FRIDAY: return 4;
        case DayOfWeek.SATURDAY: return 5;
        case DayOfWeek.SUNDAY: return 6;
        default: return -1;
      }
    }).filter(index => index !== -1);
  }, [selectedWorkoutDays]);

  // Вычисляем общее количество дней программы (28 дней)
  const totalProgramDays = 28;
  
  const days = useMemo(() => {
    // Определяем начало недели для отображения дней
    const weekStartForDays = startOfWeek(weekStart, { weekStartsOn: 1 })
    
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStartForDays, i)
      
      // Проверяем, находится ли день до даты покупки
      // Используем строгое сравнение, чтобы день начала программы был активен
      const isBeforePurchase = isBefore(date, programStart) && format(date, 'yyyy-MM-dd') !== format(programStart, 'yyyy-MM-dd')
      
      // Вычисляем день программы (от 1 до 28)
      const daysSinceProgramStart = differenceInDays(date, programStart) + 1
      
      // Проверяем, находится ли день после 28-го дня программы
      const isAfterProgram = daysSinceProgramStart > totalProgramDays
      
      // Проверяем, является ли день тренировочным
       // Определяем день недели (0 - понедельник, 6 - воскресенье)
       const dayOfWeekIndex = (date.getDay() + 6) % 7 // Преобразуем из JS формата (0 - воскресенье) в наш формат (0 - понедельник)
       
       // Проверяем, входит ли индекс дня недели в список тренировочных дней
       const isWorkoutDay = workoutDayIndices.some(index => index === dayOfWeekIndex)
      
      // Отключаем дни до даты начала программы и после окончания программы
      const isDisabled = isBeforePurchase || isAfterProgram
      
      // Вычисляем номер дня программы (только для дней в рамках программы)
      const programDay = daysSinceProgramStart > 0 && daysSinceProgramStart <= totalProgramDays 
        ? daysSinceProgramStart 
        : null
      
      return {
        key: DAY_KEYS[i],
        label: format(date, 'ЕEE', { locale: ru }).slice(1, 3),
        dateStr: format(date, 'd', { locale: ru }),
        date,
        isToday: format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
        isDisabled,
        isWorkoutDay,
        programDay
      }
    })
  }, [weekStart, currentDate, programStart, workoutDayIndices])

  const defaultDayKey = days.find(d => d.isToday)?.key || 'mon'
  const [selectedDay, setSelectedDay] = useState(defaultDayKey)

  return (
    <Tabs
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
            className={`rounded-md h-auto border border-muted px-2 py-3 text-xs flex flex-col items-center flex-1 transition-colors 
              data-[state=active]:bg-primary 
              data-[state=active]:text-primary-foreground 
              data-[state=active]:border-primary 
              ${d.isWorkoutDay ? 'bg-green-50 border-green-200' : ''} 
              ${d.isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">{d.label}</span>
            <span className="text-sm">{d.dateStr}</span>
            {d.programDay && (
              <span className="text-xs mt-1 text-muted-foreground">День {d.programDay}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {days.map(d => {
        const dailyPlanQuery = getDailyPlan(courseId, d.date)

        return (
          <TabsContent
            key={d.key}
            value={d.key}
            className="flex flex-col gap-4"
          >
            {dailyPlanQuery?.data ? (
              <>
                {dailyPlanQuery.data.warmupId && (
                  <WarmUp
                    title="Зарядка"
                    workoutId={dailyPlanQuery.data.warmupId}
                    isWorkoutDay={dailyPlanQuery.data.isWorkoutDay}
                  />
                )}
                {dailyPlanQuery.data.mainWorkoutId && (
                  <WarmUp
                    title="Тренировка"
                    workoutId={dailyPlanQuery.data.mainWorkoutId}
                    isWorkoutDay={dailyPlanQuery.data.isWorkoutDay}
                  />
                )}
              </>
            ) : (
              <>
                <WarmUp title="Зарядка" />
                <WarmUp title="Тренировка" />
              </>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
