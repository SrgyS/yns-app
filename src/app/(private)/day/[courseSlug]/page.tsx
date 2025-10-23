import { HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import {
  addDays,
  differenceInCalendarWeeks,
  differenceInDays,
  isBefore,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import type { DayOfWeek } from '@prisma/client'

import { server } from '@/app/server'
import { ContextFactory } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from '@/features/course-enrollment/_controller'
import { CourseDetailsController } from '@/features/course-details/_controller'
import { WorkoutController } from '@/features/daily-plan/_controller'
import { createControllerHelpers } from '@/shared/api/server-helpers'
import { DAYS_ORDER } from '@/features/daily-plan/constant'

import { DayPageClient } from './day-page-client'

const LOG_PREFIX = '[DayPage]'

async function logTiming<T>(label: string, action: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    return await action()
  } finally {
    const duration = Date.now() - start
    console.log(`${LOG_PREFIX} ${label} completed in ${duration}ms`)
  }
}

interface DayPageProps {
  params: Promise<{
    courseSlug: string
  }>
}

export default async function DayPage({ params }: DayPageProps) {
  const overallStart = Date.now()
  const { courseSlug } = await params

  const contextFactory = server.get(ContextFactory)
  const ctx = await logTiming('createContext', () =>
    contextFactory.createContext()
  )

  const session = ctx.session

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const userId = session.user.id

  const {
    helpers: courseEnrollmentHelpers,
    queryClient,
  } = createControllerHelpers({
    container: server,
    controller: CourseEnrollmentController,
    ctx,
  })

  const { helpers: courseDetailsHelpers } = createControllerHelpers({
    container: server,
    controller: CourseDetailsController,
    ctx,
    queryClient,
  })

  const { helpers: workoutHelpers } = createControllerHelpers({
    container: server,
    controller: WorkoutController,
    ctx,
    queryClient,
  })

  const access =
    await logTiming('checkAccessByCourseSlug', () =>
      courseEnrollmentHelpers.course.checkAccessByCourseSlug.fetch({
        userId,
        courseSlug,
      })
    )

  if (access?.hasAccess && access.enrollment) {
    const enrollment = access.enrollment
    const [enrollmentData, availableWeeksData] = await Promise.all([
      logTiming('getEnrollment.fetch', () =>
        courseEnrollmentHelpers.course.getEnrollment.fetch({
          userId,
          courseId: enrollment.courseId,
        })
      ),
      logTiming('getAvailableWeeks.fetch', () =>
        courseEnrollmentHelpers.course.getAvailableWeeks.fetch({
          userId,
          courseSlug,
        })
      ),
    ])

    await Promise.all([
      logTiming('getEnrollmentByCourseSlug.prefetch', () =>
        courseEnrollmentHelpers.course.getEnrollmentByCourseSlug.prefetch({
          userId,
          courseSlug,
        })
      ),
      logTiming('getEnrollment.prefetch', () =>
        courseEnrollmentHelpers.course.getEnrollment.prefetch({
          userId,
          courseId: enrollment.courseId,
        })
      ),
      logTiming('courseDetails.get.prefetch', () =>
        courseDetailsHelpers.courseDetails.get.prefetch({
          courseSlug,
        })
      ),
      (async () => {
        try {
          const defaultDayNumber = await logTiming(
            'computeDefaultProgramDay',
            async () =>
              computeDefaultProgramDay({
                enrollment: enrollmentData,
                availableWeeks: availableWeeksData,
              })
          )

          if (
            defaultDayNumber &&
            enrollment.courseId
          ) {
            await logTiming('getUserDailyPlan.prefetch', () =>
              workoutHelpers.getUserDailyPlan.prefetch({
                userId,
                courseId: enrollment.courseId,
                dayNumberInCourse: defaultDayNumber,
              })
            )
          }
        } catch (error) {
          console.error('Failed to prefetch daily plan', error)
        }
      })(),
    ])
  }

  const dehydratedState = courseEnrollmentHelpers.dehydrate()
  console.log(
    `${LOG_PREFIX} render completed in ${Date.now() - overallStart}ms`
  )

  return (
    <HydrationBoundary state={dehydratedState}>
      <DayPageClient courseSlug={courseSlug} />
    </HydrationBoundary>
  )
}

type EnrollmentData = {
  courseId: string
  startDate?: string | Date | null
  selectedWorkoutDays?: DayOfWeek[] | null
  course?: {
    durationWeeks?: number | null
    contentType?: string | null
  } | null
}

type AvailableWeeksData = {
  availableWeeks?: number[] | null
  weeksMeta?: Array<{ weekNumber: number; releaseAt: string }>
  currentWeekIndex?: number | null
} | null

function computeDefaultProgramDay({
  enrollment,
  availableWeeks,
  today = new Date(),
}: {
  enrollment: EnrollmentData | null
  availableWeeks: AvailableWeeksData
  today?: Date
}): number | null {
  if (!enrollment?.courseId) {
    return null
  }

  const startDate = enrollment.startDate
    ? new Date(enrollment.startDate)
    : null

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return null
  }

  const durationWeeks = enrollment.course?.durationWeeks ?? 4
  const totalProgramDays = Math.max(durationWeeks, 1) * 7
  const isSubscription = enrollment.course?.contentType === 'SUBSCRIPTION'

  const selectedWorkoutDays = enrollment.selectedWorkoutDays ?? []
  const workoutDayIndices = selectedWorkoutDays
    .map(day => DAYS_ORDER.indexOf(day))
    .filter(index => index !== -1)

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

  const currentWeek = isSubscription ? subscriptionCurrentWeek : nonSubscriptionWeek

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
    const isWorkoutDay = workoutDayIndices.some(idx => idx === dayOfWeekIndex)

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
    day => !day.isDisabled && day.normalizedDate.getTime() === normalizedToday.getTime()
  )

  const firstActive = days.find(day => !day.isDisabled)

  const defaultDay = todayActive ?? firstActive

  if (defaultDay?.programDay) {
    return defaultDay.programDay
  }

  const fallbackDay = days.find(day => day.programDay)
  return fallbackDay?.programDay ?? null
}
