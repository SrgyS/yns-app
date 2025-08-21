import { useMemo } from 'react'
import { differenceInCalendarWeeks } from 'date-fns'

export function useWorkoutCalendar(
  programStart: Date | null,
  durationWeeks?: number
) {
  const noProgram = !programStart

  const totalWeeks = useMemo(() => {
    if (!programStart) return durationWeeks ?? 4
    const startDay = programStart.getDay()
    return startDay === 1 ? (durationWeeks ?? 4) : (durationWeeks ?? 4) + 1
  }, [programStart, durationWeeks])

  const availableWeeks = useMemo(() => {
    return Array.from({ length: totalWeeks }, (_, i) => i + 1)
  }, [totalWeeks])

  const currentWeekIndex = useMemo(() => {
    if (!programStart) return 1
    const today = new Date()
    const weeks = differenceInCalendarWeeks(today, programStart, {
      weekStartsOn: 1,
    })
    return Math.min(Math.max(weeks + 1, 1), totalWeeks)
  }, [programStart, totalWeeks])

  return {
    noProgram,
    availableWeeks,
    totalWeeks,
    currentWeekIndex,
  }
}
