import { DayOfWeek } from '@prisma/client'
import { differenceInCalendarWeeks, startOfWeek } from 'date-fns'

/**
 * Сервис для работы с датами и вычислениями в планировании
 */
export class DateCalculationService {
  /**
   * Получить день недели из даты
   */
  getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ]
    return days[date.getDay()]
  }

  /**
   * Вычислить дату для определенного дня курса
   */
  calculateDateForDay(startDate: Date, dayIndex: number): Date {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + dayIndex)
    return currentDate
  }

  /**
   * Вычислить номер недели для дня курса
   */
  calculateWeekNumber(dayIndex: number, startDate?: Date): number {
    if (!startDate) {
      return Math.floor(dayIndex / 7) + 1
    }

    const normalizedStart = startOfWeek(startDate, { weekStartsOn: 1 })
    const currentDate = this.calculateDateForDay(startDate, dayIndex)

    return (
      differenceInCalendarWeeks(currentDate, normalizedStart, {
        weekStartsOn: 1,
      }) + 1
    )
  }
}
