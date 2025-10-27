import { HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { server } from '@/app/server'
import { ContextFactory } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from '@/features/course-enrollment/_controller'
import { CourseDetailsController } from '@/features/course-details/_controller'
import { WorkoutController } from '@/features/daily-plan/_controller'
import { createControllerHelpers } from '@/shared/api/server-helpers'
import { DayPlanLoadService } from '@/features/daily-plan/_services/day-plan-load-service'

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

function serializeForQuery<T>(value: T): T {
  if (value === undefined) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
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

  const dayPlanLoadService = server.get(DayPlanLoadService)
  const loadResult = await logTiming('DayPlanLoadService.load', () =>
    dayPlanLoadService.load({ userId, courseSlug })
  )

  const checkAccessOptions =
    courseEnrollmentHelpers.course.checkAccessByCourseSlug.queryOptions({
      userId,
      courseSlug,
    })
  queryClient.setQueryData(
    checkAccessOptions.queryKey,
    (() => serializeForQuery(loadResult.access)) as any
  )

  if (loadResult.enrollment) {
    const enrollmentBySlugOptions =
      courseEnrollmentHelpers.course.getEnrollmentByCourseSlug.queryOptions({
        userId,
        courseSlug,
      })
    queryClient.setQueryData(
      enrollmentBySlugOptions.queryKey,
      (() => serializeForQuery(loadResult.enrollment)) as any
    )

    const enrollmentOptions =
      courseEnrollmentHelpers.course.getEnrollment.queryOptions({
        userId,
        courseId: loadResult.enrollment.courseId,
      })
  queryClient.setQueryData(
    enrollmentOptions.queryKey,
    (() =>
      serializeForQuery(
        loadResult.enrollmentByCourseId ?? loadResult.enrollment
      )) as any
  )
  }

  if (loadResult.availableWeeks) {
    const availableWeeksOptions =
      courseEnrollmentHelpers.course.getAvailableWeeks.queryOptions({
        userId,
        courseSlug,
      })
    queryClient.setQueryData(
      availableWeeksOptions.queryKey,
      (() => serializeForQuery(loadResult.availableWeeks)) as any
    )
  }

  if (loadResult.defaultDayNumber && loadResult.enrollment) {
    const dailyPlanOptions = workoutHelpers.getUserDailyPlan.queryOptions({
      userId,
      courseId: loadResult.enrollment.courseId,
      dayNumberInCourse: loadResult.defaultDayNumber,
    })
    queryClient.setQueryData(
      dailyPlanOptions.queryKey,
      (() => serializeForQuery(loadResult.initialDailyPlan)) as any
    )
  }

  if (loadResult.access.hasAccess) {
    await logTiming('courseDetails.get.prefetch', () =>
      courseDetailsHelpers.courseDetails.get.prefetch({
        courseSlug,
      })
    )
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
