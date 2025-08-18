import { useMemo } from 'react'
import { differenceInCalendarWeeks, isMonday } from 'date-fns'

export function useWorkoutCalendar(programStart: Date | null) {
  const noProgram = !programStart

  const totalWeeks = useMemo(() => {
    if (!programStart) return 4
    return isMonday(programStart) ? 4 : 5
  }, [programStart])

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

  const gridColsClass = useMemo(() => {
    return (
      {
        4: 'grid-cols-4',
        5: 'grid-cols-5',
      }[totalWeeks] ?? 'grid-cols-4'
    )
  }, [totalWeeks])

  return {
    noProgram,
    availableWeeks,
    totalWeeks,
    currentWeekIndex,
    gridColsClass,
  }
}
