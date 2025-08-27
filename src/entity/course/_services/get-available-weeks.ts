import { injectable } from 'inversify'
import { CourseContentType } from '@prisma/client'
import { dbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { differenceInCalendarWeeks } from 'date-fns'

export interface GetAvailableWeeksParams {
  courseId: string
  enrollmentStartDate: Date
  courseContentType: CourseContentType
  courseDurationWeeks: number
}

export interface AvailableWeeksResult {
  availableWeeks: number[]
  totalWeeks: number
  currentWeekIndex: number
}

@injectable()
export class GetAvailableWeeksService {
  private readonly SUBSCRIPTION_WINDOW_SIZE = 4 // Размер окна для подписочных курсов

  async exec(params: GetAvailableWeeksParams): Promise<AvailableWeeksResult> {
    const { courseId, enrollmentStartDate, courseContentType, courseDurationWeeks } = params

    try {
      if (courseContentType === CourseContentType.FIXED_COURSE) {
        return this.getFixedCourseWeeks(enrollmentStartDate, courseDurationWeeks)
      } else if (courseContentType === CourseContentType.SUBSCRIPTION_COURSE_MONTHLY) {
        return await this.getSubscriptionCourseWeeks(courseId, enrollmentStartDate, courseDurationWeeks)
      }

      throw new Error(`Unsupported course content type: ${courseContentType}`)
    } catch (error) {
      logger.error({
        msg: 'Error getting available weeks',
        courseId,
        enrollmentStartDate,
        courseContentType,
        error,
      })
      throw new Error('Failed to get available weeks')
    }
  }

  /**
   * Для фиксированных курсов возвращаем все недели
   */
  private getFixedCourseWeeks(
    enrollmentStartDate: Date,
    courseDurationWeeks: number
  ): AvailableWeeksResult {
    const today = new Date()
    const startDay = enrollmentStartDate.getDay()
    const totalWeeks = startDay === 1 ? courseDurationWeeks : courseDurationWeeks + 1
    
    const availableWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)
    
    const currentWeekIndex = Math.min(
      Math.max(
        differenceInCalendarWeeks(today, enrollmentStartDate, {
          weekStartsOn: 1,
        }) + 1,
        1
      ),
      totalWeeks
    )

    return {
      availableWeeks,
      totalWeeks,
      currentWeekIndex,
    }
  }

  /**
   * Для подписочных курсов возвращаем скользящее окно из 4 недель
   */
  private async getSubscriptionCourseWeeks(
    courseId: string,
    enrollmentStartDate: Date,
    courseDurationWeeks: number
  ): Promise<AvailableWeeksResult> {
    const today = new Date()
    
    // Получаем все доступные недели курса из базы данных
    const availableWeeksInDb = await dbClient.week.findMany({
      where: {
        courseId,
        releaseAt: {
          lte: today, // Только те недели, которые уже выпущены
        },
      },
      select: {
        weekNumber: true,
        releaseAt: true,
      },
      orderBy: {
        weekNumber: 'asc',
      },
    })

    if (availableWeeksInDb.length === 0) {
      // Если нет доступных недель в базе, возвращаем пустой результат
      return {
        availableWeeks: [],
        totalWeeks: courseDurationWeeks,
        currentWeekIndex: 1,
      }
    }

    // Определяем неделю, на которой пользователь начал курс
    const enrollmentWeekNumber = this.getEnrollmentWeekNumber(
      enrollmentStartDate,
      availableWeeksInDb
    )

    // Определяем текущую неделю относительно начала курса
    const currentWeekIndex = Math.min(
      Math.max(
        differenceInCalendarWeeks(today, enrollmentStartDate, {
          weekStartsOn: 1,
        }) + 1,
        1
      ),
      courseDurationWeeks
    )

    // Вычисляем скользящее окно
    const windowStart = Math.max(enrollmentWeekNumber, currentWeekIndex - this.SUBSCRIPTION_WINDOW_SIZE + 1)
    const windowEnd = Math.min(
      windowStart + this.SUBSCRIPTION_WINDOW_SIZE - 1,
      Math.max(...availableWeeksInDb.map(w => w.weekNumber))
    )

    // Фильтруем доступные недели в пределах окна
    const availableWeeks = availableWeeksInDb
      .filter(week => week.weekNumber >= windowStart && week.weekNumber <= windowEnd)
      .map(week => week.weekNumber)

    return {
      availableWeeks,
      totalWeeks: courseDurationWeeks,
      currentWeekIndex,
    }
  }

  /**
   * Определяет номер недели, на которой пользователь начал курс
   */
  private getEnrollmentWeekNumber(
    enrollmentStartDate: Date,
    availableWeeks: Array<{ weekNumber: number; releaseAt: Date }>
  ): number {
    // Находим первую неделю, которая была доступна на момент записи пользователя
    const availableAtEnrollment = availableWeeks.filter(
      week => week.releaseAt <= enrollmentStartDate
    )

    if (availableAtEnrollment.length === 0) {
      // Если на момент записи не было доступных недель, начинаем с первой доступной
      return Math.min(...availableWeeks.map(w => w.weekNumber))
    }

    // Возвращаем последнюю доступную неделю на момент записи
    return Math.max(...availableAtEnrollment.map(w => w.weekNumber))
  }
}