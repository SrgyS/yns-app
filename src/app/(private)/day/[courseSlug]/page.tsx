import { HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { ContextFactory } from '@/kernel/lib/trpc/module'
import { CourseEnrollmentController } from '@/features/course-enrollment/_controller'
import { CourseDetailsController } from '@/features/course-details/_controller'
import { createControllerHelpers } from '@/shared/api/server-helpers'

import { DayPageClient } from './day-page-client'

interface DayPageProps {
  params: Promise<{
    courseSlug: string
  }>
}

export default async function DayPage({ params }: DayPageProps) {
  const { courseSlug } = await params

  const contextFactory = server.get(ContextFactory)
  const ctx = await contextFactory.createContext()

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

  const access =
    await courseEnrollmentHelpers.course.checkAccessByCourseSlug.fetch({
      userId,
      courseSlug,
    })

  if (access?.hasAccess && access.enrollment) {
    await Promise.all([
      courseEnrollmentHelpers.course.getEnrollmentByCourseSlug.prefetch({
        userId,
        courseSlug,
      }),
      courseEnrollmentHelpers.course.getAvailableWeeks.prefetch({
        userId,
        courseSlug,
      }),
      courseEnrollmentHelpers.course.getEnrollment.prefetch({
        userId,
        courseId: access.enrollment.courseId,
      }),
      courseDetailsHelpers.courseDetails.get.prefetch({
        courseSlug,
      }),
    ])
  }

  const dehydratedState = courseEnrollmentHelpers.dehydrate()

  return (
    <HydrationBoundary state={dehydratedState}>
      <DayPageClient courseSlug={courseSlug} />
    </HydrationBoundary>
  )
}
