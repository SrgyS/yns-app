import { injectable } from 'inversify'
import { CourseContentType } from '@prisma/client'
import { dbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { differenceInCalendarWeeks, startOfWeek, addDays } from 'date-fns'

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
  weeksMeta?: Array<{ weekNumber: number; releaseAt: string }>
}

@injectable()
export class GetAvailableWeeksService {
  private readonly SUBSCRIPTION_WINDOW_SIZE = 4 // Размер окна для подписочных курсов

  async exec(params: GetAvailableWeeksParams): Promise<AvailableWeeksResult> {
    const { courseId, enrollmentStartDate, courseContentType, courseDurationWeeks } = params

    try {
      if (courseContentType === CourseContentType.FIXED_COURSE) {
        return this.getFixedCourseWeeks(enrollmentStartDate, courseDurationWeeks)
      } else if (courseContentType === CourseContentType.SUBSCRIPTION) {
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
   * Подписка: окно максимум из 4 недель, начиная с ТЕКУЩЕЙ календарной недели (пн-вс) и вперёд,
   * но не раньше недели покупки. Показываем только те недели, для которых релиз уже состоялся (releaseAt <= today).
   * Если в окне нет релизов — возвращаем пусто ("Нет доступных тренировок").
   */
  private async getSubscriptionCourseWeeks(
    courseId: string,
    enrollmentStartDate: Date,
    courseDurationWeeks: number
  ): Promise<AvailableWeeksResult> {
    const today = new Date()

    const releasedWeeks = await dbClient.week.findMany({
      where: {
        courseId,
        releaseAt: {
          lte: today,
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

    if (releasedWeeks.length === 0) {
      return {
        availableWeeks: [],
        totalWeeks: courseDurationWeeks,
        currentWeekIndex: 0,
        weeksMeta: [],
      }
    }

    const purchaseWeekStart = startOfWeek(enrollmentStartDate, { weekStartsOn: 1 })
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })

    // Окно видимости: текущая неделя и следующие (в пределах 4 недель)
    const windowStart = currentWeekStart
    const windowEnd = addDays(currentWeekStart, 7 * (this.SUBSCRIPTION_WINDOW_SIZE - 1))

    // В окне оставляем только недели, не раньше недели покупки и не раньше текущей недели
    const windowWeeks = releasedWeeks.filter(w => {
      const wStart = startOfWeek(w.releaseAt, { weekStartsOn: 1 })
      return (
        wStart.getTime() >= purchaseWeekStart.getTime() &&
        wStart.getTime() >= windowStart.getTime() &&
        wStart.getTime() <= windowEnd.getTime()
      )
    })

    if (windowWeeks.length === 0) {
      return {
        availableWeeks: [],
        totalWeeks: courseDurationWeeks,
        currentWeekIndex: 0,
        weeksMeta: [],
      }
    }

    const availableWeeks = windowWeeks.map(w => w.weekNumber)

    // Активная неделя — текущая, если она присутствует (иначе безопасно берём первую из окна)
    const currentInWindow = windowWeeks.find(w => {
      return startOfWeek(w.releaseAt, { weekStartsOn: 1 }).getTime() === currentWeekStart.getTime()
    })

    const active = currentInWindow ?? windowWeeks[0]

    return {
      availableWeeks,
      totalWeeks: courseDurationWeeks,
      currentWeekIndex: active.weekNumber,
      weeksMeta: windowWeeks.map(w => ({ weekNumber: w.weekNumber, releaseAt: w.releaseAt.toISOString() })),
    }
  }

  /**
   * Определяет номер недели, на которой пользователь начал курс
   */
  // private getEnrollmentWeekNumber(
  //   enrollmentStartDate: Date,
  //   availableWeeks: Array<{ weekNumber: number; releaseAt: Date }>
  // ): number {
  //   // Находим первую неделю, которая была доступна на момент записи пользователя
  //   const availableAtEnrollment = availableWeeks.filter(
  //     week => week.releaseAt <= enrollmentStartDate
  //   )

  //   if (availableAtEnrollment.length === 0) {
  //     // Если на момент записи не было доступных недель, начинаем с первой доступной
  //     return Math.min(...availableWeeks.map(w => w.weekNumber))
  //   }

  //   // Возвращаем последнюю доступную неделю на момент записи
  //   return Math.max(...availableAtEnrollment.map(w => w.weekNumber))
  // }
}