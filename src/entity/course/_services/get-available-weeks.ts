import { injectable } from 'inversify'
import { CourseContentType } from '@prisma/client'
import { dbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { differenceInCalendarWeeks, startOfWeek, addDays } from 'date-fns'
import { UserAccessRepository } from '@/entity/user-access/_repository/user-access'
import { ContentType } from '@/kernel/domain/course'

export interface GetAvailableWeeksParams {
  userId: string
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

  constructor(private userAccessRepository: UserAccessRepository) {}

  async exec(params: GetAvailableWeeksParams): Promise<AvailableWeeksResult> {
    const { userId, courseId, enrollmentStartDate, courseContentType, courseDurationWeeks } = params

    try {
      // Получаем срок действия доступа (если есть)
      const access = await this.userAccessRepository.findUserCourseAccess(
        userId,
        courseId,
        courseContentType as unknown as ContentType
      )
      const expiresAt = access?.expiresAt ?? null

      if (courseContentType === CourseContentType.FIXED_COURSE) {
        return this.getFixedCourseWeeks(enrollmentStartDate, courseDurationWeeks, expiresAt)
      } else if (courseContentType === CourseContentType.SUBSCRIPTION) {
        return await this.getSubscriptionCourseWeeks(courseId, enrollmentStartDate, courseDurationWeeks, expiresAt)
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
   * Для фиксированных курсов возвращаем недели курса (1..duration),
   * доступ к тренировкам закрывается сразу после истечения доступа (expiresAt < today).
   */
  private getFixedCourseWeeks(
    enrollmentStartDate: Date,
    courseDurationWeeks: number,
    expiresAt: Date | null
  ): AvailableWeeksResult {
    const today = new Date()

    // После истечения доступа — ничего не доступно
    if (expiresAt && today.getTime() > expiresAt.getTime()) {
      const startDayForTotal = enrollmentStartDate.getDay()
      const totalWeeksAfter = startDayForTotal === 1 ? courseDurationWeeks : courseDurationWeeks + 1
      return {
        availableWeeks: [],
        totalWeeks: totalWeeksAfter,
        currentWeekIndex: 0,
      }
    }

    const startDay = enrollmentStartDate.getDay()
    const totalWeeks = startDay === 1 ? courseDurationWeeks : courseDurationWeeks + 1

    // Если есть expiresAt — ограничиваем количество доступных недель по периоду доступа,
    // но не расширяем количество недель сверх самого курса
    let allowedWeeksCount = totalWeeks
    if (expiresAt) {
      if (expiresAt.getTime() < enrollmentStartDate.getTime()) {
        // Доступ истёк до начала — ничего не доступно
        return {
          availableWeeks: [],
          totalWeeks,
          currentWeekIndex: 0,
        }
      }
      const weeksByExpiry =
        differenceInCalendarWeeks(expiresAt, enrollmentStartDate, {
          weekStartsOn: 1,
        }) + 1
      allowedWeeksCount = Math.max(0, Math.min(totalWeeks, weeksByExpiry))
    }

    const availableWeeks = Array.from({ length: allowedWeeksCount }, (_, i) => i + 1)

    let currentWeekIndex = Math.min(
      Math.max(
        differenceInCalendarWeeks(today, enrollmentStartDate, {
          weekStartsOn: 1,
        }) + 1,
        1
      ),
      totalWeeks
    )

    // Не даём активной неделе выходить за пределы доступных (после ограничения expiresAt)
    if (availableWeeks.length === 0) {
      currentWeekIndex = 0
    } else if (currentWeekIndex > availableWeeks.length) {
      currentWeekIndex = availableWeeks.length
    }

    return {
      availableWeeks,
      totalWeeks,
      currentWeekIndex,
    }
  }

  /**
   * Подписка: окно максимум из 4 недель, начиная с ТЕКУЩЕЙ календарной недели (пн-вс) и вперёд,
   * но не раньше недели покупки. Показываем только те недели, для которых релиз уже состоялся (releaseAt <= today).
   * Также ограничиваем окно датой истечения доступа (expiresAt), если она задана.
   * Если в окне нет релизов — возвращаем пусто ("Нет доступных тренировок").
   * После фактического истечения доступа (today > expiresAt) — ничего не показываем.
   */
  private async getSubscriptionCourseWeeks(
    courseId: string,
    enrollmentStartDate: Date,
    courseDurationWeeks: number,
    expiresAt: Date | null
  ): Promise<AvailableWeeksResult> {
    const today = new Date()

    // После истечения доступа — ничего не доступно
    if (expiresAt && today.getTime() > expiresAt.getTime()) {
      return {
        availableWeeks: [],
        totalWeeks: courseDurationWeeks,
        currentWeekIndex: 0,
        weeksMeta: [],
      }
    }

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
    const baseWindowStart = currentWeekStart
    const baseWindowEnd = addDays(currentWeekStart, 7 * (this.SUBSCRIPTION_WINDOW_SIZE - 1))
 
    // Учитываем истечение доступа: неделя истечения — это неделя, в которую попадает expiresAt
    const windowStart = baseWindowStart
    let windowEnd = baseWindowEnd
    if (expiresAt) {
      const expiryWeekStart = startOfWeek(expiresAt, { weekStartsOn: 1 })
      const expiryWeekEnd = addDays(expiryWeekStart, 6)
      if (expiryWeekEnd.getTime() < windowEnd.getTime()) {
        windowEnd = expiryWeekEnd
      }
      // Если доступ истёк раньше текущей недели — ничего не доступно
      if (expiryWeekEnd.getTime() < windowStart.getTime()) {
        return {
          availableWeeks: [],
          totalWeeks: courseDurationWeeks,
          currentWeekIndex: 0,
          weeksMeta: [],
        }
      }
    }
 
    // В окне оставляем только недели, не раньше недели покупки, не раньше текущей недели и не позже окна/истечения
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
      return startOfWeek(w.releaseAt, { weekStartsOn: 1 }).getTime() === startOfWeek(today, { weekStartsOn: 1 }).getTime()
    })

    const active = currentInWindow ?? windowWeeks[0]

    return {
      availableWeeks,
      totalWeeks: courseDurationWeeks,
      currentWeekIndex: active.weekNumber,
      weeksMeta: windowWeeks.map(w => ({ weekNumber: w.weekNumber, releaseAt: w.releaseAt.toISOString() })),
    }
  }
}