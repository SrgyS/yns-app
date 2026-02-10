
import { useAvailableWeeksQuery } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'

export function useWorkoutCalendar(
  programStart: Date | null,
  durationWeeks?: number,
  courseSlug?: string,
  isSubscription?: boolean
) {
  const { data: session } = useAppSession()
  // Получаем доступные недели для курса-подписки
  const availableWeeksQuery = useAvailableWeeksQuery(
    session?.user?.id || '',
    courseSlug || ''
  )

  const totalWeeksFromApi = availableWeeksQuery.data?.totalWeeks ?? null
  const availableWeeksFromApi = availableWeeksQuery.data?.availableWeeks ?? null
  const maxDayNumberFromApi = availableWeeksQuery.data?.maxDayNumber ?? null

  const noProgram = !programStart

  const totalWeeks = (() => {
    if (totalWeeksFromApi && totalWeeksFromApi > 0) {
      return totalWeeksFromApi
    }

    const fallbackWeeks = durationWeeks ?? 4

    if (!programStart) {
      return fallbackWeeks
    }

    const startDay = programStart.getDay()
    return startDay === 1 ? fallbackWeeks : fallbackWeeks + 1
  })()

  const availableWeeks = (() => {
    if (
      availableWeeksFromApi &&
      Array.isArray(availableWeeksFromApi) &&
      availableWeeksFromApi.length > 0
    ) {
      return availableWeeksFromApi
    }

    return Array.from({ length: totalWeeks }, (_, i) => i + 1)
  })()

  const weeksMeta = (() => {
    if (isSubscription) {
      return availableWeeksQuery.data?.weeksMeta ?? []
    }
    return [] as Array<{ weekNumber: number; releaseAt: string }>
  })()

  const currentWeekIndex = (() => {
    // Для курсов-подписок используем данные из API. Пока данных нет — возвращаем 0,
    // чтобы родитель мог отобразить плейсхолдер/сообщение и не активировать табы.
    if (isSubscription) {
      return availableWeeksQuery.data?.currentWeekIndex ?? 0
    }
    // Для обычных курсов вычисляем как раньше
    if (!programStart) return 1
    const today = new Date()

    const diff =
      (availableWeeksQuery.data?.currentWeekIndex ??
        Math.ceil(
          (today.getTime() - programStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )) ||
      1

    return Math.min(Math.max(diff, 1), totalWeeks)
  })()

  return {
    noProgram,
    availableWeeks,
    totalWeeks,
    currentWeekIndex,
    weeksMeta,
    maxDayNumber: maxDayNumberFromApi,
    isLoading: isSubscription ? availableWeeksQuery.isLoading : false,
  }
}
