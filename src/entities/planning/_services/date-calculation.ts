import { DayOfWeek } from '@prisma/client'

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
  calculateWeekNumber(dayIndex: number): number {
    return Math.floor(dayIndex / 7) + 1
  }
}
