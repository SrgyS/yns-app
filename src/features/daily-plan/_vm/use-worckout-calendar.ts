import { useMemo } from 'react'
import { differenceInCalendarWeeks } from 'date-fns'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'

export function useWorkoutCalendar(
  programStart: Date | null,
  durationWeeks?: number,
  courseSlug?: string,
  isSubscription?: boolean
) {
  const { data: session } = useAppSession()
  const { getAvailableWeeks } = useCourseEnrollment()

  // Получаем доступные недели для курса-подписки
  const availableWeeksQuery = getAvailableWeeks(
    session?.user?.id || '',
    courseSlug || ''
  )

  const noProgram = !programStart

  const totalWeeks = useMemo(() => {
    if (!programStart) return durationWeeks ?? 4
    const startDay = programStart.getDay()
    return startDay === 1 ? (durationWeeks ?? 4) : (durationWeeks ?? 4) + 1
  }, [programStart, durationWeeks])

  const availableWeeks = useMemo(() => {
    // Для курсов-подписок используем данные из API. Пока данные грузятся — возвращаем пустой список,
    // чтобы не падать обратно на логику фиксированных курсов и не показывать неверные недели.
    if (isSubscription) {
      return availableWeeksQuery.data?.availableWeeks ?? []
    }
    // Для обычных курсов возвращаем все недели
    return Array.from({ length: totalWeeks }, (_, i) => i + 1)
  }, [isSubscription, availableWeeksQuery.data, totalWeeks])

  const weeksMeta = useMemo(() => {
    if (isSubscription) {
      return availableWeeksQuery.data?.weeksMeta ?? []
    }
    return [] as Array<{ weekNumber: number; releaseAt: string }>
  }, [isSubscription, availableWeeksQuery.data])

  const currentWeekIndex = useMemo(() => {
    // Для курсов-подписок используем данные из API. Пока данных нет — возвращаем 0,
    // чтобы родитель мог отобразить плейсхолдер/сообщение и не активировать табы.
    if (isSubscription) {
      return availableWeeksQuery.data?.currentWeekIndex ?? 0
    }
    // Для обычных курсов вычисляем как раньше
    if (!programStart) return 1
    const today = new Date()
    const weeks = differenceInCalendarWeeks(today, programStart, {
      weekStartsOn: 1,
    })
    return Math.min(Math.max(weeks + 1, 1), totalWeeks)
  }, [isSubscription, availableWeeksQuery.data, programStart, totalWeeks])

  return {
    noProgram,
    availableWeeks,
    totalWeeks,
    currentWeekIndex,
    weeksMeta,
    isLoading: Boolean(isSubscription) ? availableWeeksQuery.isLoading : false,
  }
}
