import { injectable } from 'inversify'
import { CourseContentType } from '@prisma/client'
import {
  addDays,
  differenceInCalendarWeeks,
  differenceInDays,
  isBefore,
  startOfDay,
  startOfWeek,
} from 'date-fns'

import { CourseSlug } from '@/kernel/domain/course'
import { Course, UserCourseEnrollment, UserDailyPlan } from '@/entities/course'
import { GetCourseService } from '@/entities/course/_services/get-course'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { GetEnrollmentByCourseSlugService } from '@/features/course-enrollment/_services/get-enrollment-by-course-slug'
import {
  AvailableWeeksResult,
  GetAvailableWeeksService,
} from '@/features/course-enrollment/_services/get-available-weeks'
import { GetActiveEnrollmentService } from '@/entities/course/_services/get-active-enrollment'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { GetUserDailyPlanService } from './get-user-daily-plan'
import { DAYS_ORDER } from '../constant'

type AccessPayload = {
  hasAccess: boolean
  enrollment: UserCourseEnrollment | null
  activeEnrollment: UserCourseEnrollment | null
  isActive: boolean
  accessExpiresAt: Date | null
  setupCompleted: boolean
}

export interface DayPlanLoadParams {
  userId: string
  courseSlug: CourseSlug
  today?: Date
}

export interface DayPlanLoadResult {
  course: Course | null
  access: AccessPayload
  enrollment: UserCourseEnrollment | null
  enrollmentByCourseId: UserCourseEnrollment | null
  availableWeeks: AvailableWeeksResult | null
  defaultDayNumber: number | null
  initialDailyPlan: UserDailyPlan | null
}

@injectable()
export class DayPlanLoadService {
  constructor(
    private readonly getCourseService: GetCourseService,
    private readonly checkCourseAccessService: CheckCourseAccessService,
    private readonly getEnrollmentByCourseSlugService: GetEnrollmentByCourseSlugService,
    private readonly getActiveEnrollmentService: GetActiveEnrollmentService,
    private readonly userAccessRepository: UserAccessRepository,
    private readonly getAvailableWeeksService: GetAvailableWeeksService,
    private readonly getUserDailyPlanService: GetUserDailyPlanService
  ) {}

  async load({
    userId,
    courseSlug,
    today = new Date(),
  }: DayPlanLoadParams): Promise<DayPlanLoadResult> {
    const course = await this.getCourseService.exec({ slug: courseSlug })

    if (!course || !course.product) {
      return {
        course: course ?? null,
        access: {
          hasAccess: false,
          enrollment: null,
          activeEnrollment: null,
          isActive: false,
          accessExpiresAt: null,
          setupCompleted: false,
        },
        enrollment: null,
        enrollmentByCourseId: null,
        availableWeeks: null,
        defaultDayNumber: null,
        initialDailyPlan: null,
      }
    }

    const hasAccess = await this.checkCourseAccessService.exec({
      userId,
      course: {
        id: course.id,
        product: course.product,
        contentType: course.contentType,
      },
    })

    const enrollmentBySlug = hasAccess
      ? await this.getEnrollmentByCourseSlugService.exec(userId, courseSlug)
      : null

    const enrollmentByCourseId = enrollmentBySlug

    const activeEnrollment = await this.getActiveEnrollmentService.exec(userId)

    const isActive =
      Boolean(
        activeEnrollment &&
          enrollmentBySlug &&
          activeEnrollment.courseId === enrollmentBySlug.courseId
      ) || false

    const userAccess = await this.userAccessRepository.findUserCourseAccess(
      userId,
      course.id,
      course.contentType
    )

    let availableWeeks: AvailableWeeksResult | null = null

    if (hasAccess && enrollmentBySlug) {
      availableWeeks = await this.getAvailableWeeksService.exec({
        userId,
        courseId: enrollmentBySlug.courseId,
        enrollmentId: enrollmentBySlug.id,
        enrollmentStartDate: enrollmentBySlug.startDate,
        courseContentType: course.contentType as unknown as CourseContentType,
        courseDurationWeeks: course.durationWeeks,
      })
    }

    const defaultDayNumber = computeDefaultProgramDay({
      enrollment: enrollmentBySlug,
      availableWeeks,
      today,
    })

    let initialDailyPlan: UserDailyPlan | null = null
    if (
      hasAccess &&
      enrollmentBySlug &&
      defaultDayNumber &&
      defaultDayNumber > 0
    ) {
      initialDailyPlan = await this.getUserDailyPlanService.exec(
        {
          userId,
          courseId: enrollmentBySlug.courseId,
          dayNumberInCourse: defaultDayNumber,
        },
        {
          course,
          hasAccess,
        }
      )
    }

    return {
      course,
      access: {
        hasAccess,
        enrollment: enrollmentBySlug,
        activeEnrollment,
        isActive,
        accessExpiresAt: userAccess?.expiresAt ?? null,
        setupCompleted: Boolean(userAccess?.setupCompleted),
      },
      enrollment: enrollmentBySlug,
      enrollmentByCourseId,
      availableWeeks,
      defaultDayNumber,
      initialDailyPlan,
    }
  }
}

export function computeDefaultProgramDay({
  enrollment,
  availableWeeks,
  today = new Date(),
}: {
  enrollment: UserCourseEnrollment | null
  availableWeeks: AvailableWeeksResult | null
  today?: Date
}): number | null {
  if (!enrollment?.courseId) {
    return null
  }

  const startDate = enrollment.startDate ? new Date(enrollment.startDate) : null

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return null
  }

  const durationWeeks = enrollment.course?.durationWeeks ?? 4
  const totalProgramDays = Math.max(durationWeeks, 1) * 7
  const isSubscription = enrollment.course?.contentType === 'SUBSCRIPTION'

  const selectedWorkoutDays = enrollment.selectedWorkoutDays ?? []

  const workoutDayIndices = selectedWorkoutDays.reduce((acc, day) => {
    const index = DAYS_ORDER.indexOf(day)
    if (index !== -1) {
      acc.add(index)
    }
    return acc
  }, new Set<number>())

  const programStart = startDate
  const effectiveEnrollmentStart = isSubscription
    ? startOfWeek(programStart, { weekStartsOn: 1 })
    : programStart

  const baseWeekStart = startOfWeek(programStart, { weekStartsOn: 1 })

  const availableWeeksData = availableWeeks ?? undefined
  const weeksMeta = availableWeeksData?.weeksMeta ?? []

  const subscriptionCurrentWeek = Math.max(
    availableWeeksData?.currentWeekIndex ?? 1,
    1
  )

  const nonSubscriptionWeek = (() => {
    const weeks = differenceInCalendarWeeks(today, programStart, {
      weekStartsOn: 1,
    })
    return Math.min(Math.max(weeks + 1, 1), Math.max(durationWeeks, 1))
  })()

  const currentWeek = isSubscription
    ? subscriptionCurrentWeek
    : nonSubscriptionWeek

  const displayWeekStart = isSubscription
    ? (() => {
        const meta = weeksMeta.find(entry => entry.weekNumber === currentWeek)
        const releaseDate = meta ? new Date(meta.releaseAt) : today
        return startOfWeek(releaseDate, { weekStartsOn: 1 })
      })()
    : addDays(baseWeekStart, (currentWeek - 1) * 7)

  const weekStartForDays = startOfWeek(displayWeekStart, { weekStartsOn: 1 })

  const normalizedProgramStart = startOfDay(effectiveEnrollmentStart)
  const normalizedToday = startOfDay(today)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStartForDays, index)
    const normalizedDate = startOfDay(date)

    const isBeforePurchase =
      isBefore(date, effectiveEnrollmentStart) &&
      normalizedDate.getTime() !== normalizedProgramStart.getTime()

    const daysSinceProgramStart =
      differenceInDays(normalizedDate, normalizedProgramStart) + 1

    const isAfterProgram = daysSinceProgramStart > totalProgramDays

    const dayOfWeekIndex = (date.getDay() + 6) % 7
    const isWorkoutDay = workoutDayIndices.has(dayOfWeekIndex)

    const isDisabled = isSubscription
      ? isAfterProgram
      : isBeforePurchase || isAfterProgram

    const programDay =
      daysSinceProgramStart > 0 && daysSinceProgramStart <= totalProgramDays
        ? daysSinceProgramStart
        : null

    return {
      date,
      normalizedDate,
      isDisabled,
      isWorkoutDay,
      programDay,
    }
  })

  const todayActive = days.find(
    day =>
      !day.isDisabled &&
      day.normalizedDate.getTime() === normalizedToday.getTime()
  )

  const firstActive = days.find(day => !day.isDisabled)

  const defaultDay = todayActive ?? firstActive

  if (defaultDay?.programDay) {
    return defaultDay.programDay
  }

  const fallbackDay = days.find(day => day.programDay)
  return fallbackDay?.programDay ?? null
}
