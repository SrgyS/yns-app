import { inject, injectable } from 'inversify'
import { CourseContentType } from '@prisma/client'
import { differenceInCalendarWeeks, startOfWeek, addDays } from 'date-fns'

import { UserDailyPlanRepository } from '@/entities/course/_repositories/user-daily-plan'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { ContentType } from '@/kernel/domain/course'
import { dbClient } from '@/shared/lib/db'

export interface GetAvailableWeeksParams {
  userId: string
  courseId: string
  enrollmentId: string
  enrollmentStartDate: Date
  courseContentType: CourseContentType
  courseDurationWeeks: number
}

export interface AvailableWeeksResult {
  availableWeeks: number[]
  totalWeeks: number
  currentWeekIndex: number
  weeksMeta?: Array<{ weekNumber: number; releaseAt: string }>
  maxDayNumber?: number
  totalDays?: number
}

@injectable()
export class GetAvailableWeeksService {
  private readonly SUBSCRIPTION_WINDOW_SIZE = 4

  constructor(
    @inject(UserAccessRepository)
    private readonly userAccessRepository: UserAccessRepository,
    @inject(UserDailyPlanRepository)
    private readonly userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async exec(params: GetAvailableWeeksParams): Promise<AvailableWeeksResult> {
    const {
      userId,
      courseId,
      enrollmentId,
      enrollmentStartDate,
      courseContentType,
      courseDurationWeeks,
    } = params

    const access = await this.userAccessRepository.findUserCourseAccess(
      userId,
      courseId,
      courseContentType as unknown as ContentType
    )
    const expiresAt = access?.expiresAt ?? null

    if (courseContentType === CourseContentType.FIXED_COURSE) {
      return this.getFixedCourseWeeks(
        enrollmentId,
        enrollmentStartDate,
        courseDurationWeeks,
        expiresAt
      )
    }

    if (courseContentType === CourseContentType.SUBSCRIPTION) {
      return this.getSubscriptionCourseWeeks(
        courseId,
        enrollmentStartDate,
        courseDurationWeeks,
        expiresAt
      )
    }

    throw new Error(`Unsupported course content type: ${courseContentType}`)
  }

  private async getFixedCourseWeeks(
    enrollmentId: string,
    enrollmentStartDate: Date,
    courseDurationWeeks: number,
    expiresAt: Date | null
  ): Promise<AvailableWeeksResult> {
    const today = new Date()

    if (expiresAt && today > expiresAt) {
      const startDay = enrollmentStartDate.getDay()
      const totalWeeksAfter =
        startDay === 1 ? courseDurationWeeks : courseDurationWeeks + 1

      return {
        availableWeeks: [],
        totalWeeks: totalWeeksAfter,
        currentWeekIndex: 0,
      }
    }

    const startDay = enrollmentStartDate.getDay()
    const baseTotalWeeks =
      startDay === 1 ? courseDurationWeeks : courseDurationWeeks + 1

    const weeklySummary = await this.userDailyPlanRepository.getWeeklySummary(
      enrollmentId,
      dbClient
    )

    const totalWeeks = Math.max(baseTotalWeeks, weeklySummary.totalWeeks)

    let allowedWeeksCount = totalWeeks

    if (expiresAt) {
      if (expiresAt < enrollmentStartDate) {
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

    const availableWeeks = (() => {
      const weeksSet = new Set<number>()

      weeklySummary.distinctWeeks.forEach(week => {
        if (week <= allowedWeeksCount) {
          weeksSet.add(week)
        }
      })

      for (let week = 1; week <= allowedWeeksCount; week++) {
        weeksSet.add(week)
      }

      return Array.from(weeksSet).sort((a, b) => a - b)
    })()

    let currentWeekIndex = Math.min(
      Math.max(
        differenceInCalendarWeeks(today, enrollmentStartDate, {
          weekStartsOn: 1,
        }) + 1,
        1
      ),
      totalWeeks
    )

    if (availableWeeks.length === 0) {
      currentWeekIndex = 0
    } else if (currentWeekIndex > availableWeeks.length) {
      currentWeekIndex = availableWeeks.length
    }

    return {
      availableWeeks,
      totalWeeks,
      currentWeekIndex,
      maxDayNumber: weeklySummary.maxDayNumber,
      totalDays: weeklySummary.totalDays,
    }
  }

  private async getSubscriptionCourseWeeks(
    courseId: string,
    enrollmentStartDate: Date,
    courseDurationWeeks: number,
    expiresAt: Date | null
  ): Promise<AvailableWeeksResult> {
    const today = new Date()

    if (expiresAt && today > expiresAt) {
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

    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })

    const baseWindowStart = currentWeekStart
    let baseWindowEnd = addDays(
      currentWeekStart,
      7 * (this.SUBSCRIPTION_WINDOW_SIZE - 1)
    )

    if (expiresAt) {
      const expiryWeekStart = startOfWeek(expiresAt, { weekStartsOn: 1 })
      const expiryWeekEnd = addDays(expiryWeekStart, 6)
      if (expiryWeekEnd.getTime() < baseWindowEnd.getTime()) {
        baseWindowEnd = expiryWeekEnd
      }
      if (expiryWeekEnd.getTime() < baseWindowStart.getTime()) {
        return {
          availableWeeks: [],
          totalWeeks: courseDurationWeeks,
          currentWeekIndex: 0,
          weeksMeta: [],
        }
      }
    }

    const windowStart = baseWindowStart
    const windowEnd = baseWindowEnd

    const visibleWeeks = releasedWeeks.filter(week => {
      const weekStart = startOfWeek(new Date(week.releaseAt), {
        weekStartsOn: 1,
      })
      const weekEnd = addDays(weekStart, 6)

      return (
        weekEnd.getTime() >= windowStart.getTime() &&
        weekStart.getTime() <= windowEnd.getTime()
      )
    })

    const availableWeeks = visibleWeeks
      .map(week => week.weekNumber)
      .filter(week => week > 0)

    const currentWeekIndex = availableWeeks.length
      ? availableWeeks[availableWeeks.length - 1]
      : 0

    return {
      availableWeeks,
      totalWeeks: courseDurationWeeks,
      currentWeekIndex,
      weeksMeta: visibleWeeks.map(week => ({
        weekNumber: week.weekNumber,
        releaseAt: week.releaseAt.toISOString(),
      })),
    }
  }
}
