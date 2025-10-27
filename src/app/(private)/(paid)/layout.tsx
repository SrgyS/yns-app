import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import type { UserCourseEnrollment } from '@/entities/course'
import {
  PaidAccessProvider,
  type PaidAccessState,
} from '@/features/course-enrollment/_vm/paid-access-context'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'

function toUserCourseEnrollmentApi(
  enrollment: UserCourseEnrollment
) {
  // We pass this through React context on the client, so convert nested dates
  // to their serialized (API) shape ahead of time.
  return {
    id: enrollment.id,
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    selectedWorkoutDays: enrollment.selectedWorkoutDays,
    startDate: new Date(enrollment.startDate).toISOString(),
    hasFeedback: enrollment.hasFeedback,
    active: enrollment.active,
    course: enrollment.course
      ? {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          title: enrollment.course.title,
        }
      : undefined,
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const userId = session.user.id

  const getAccessibleEnrollmentsService = server.get(
    GetAccessibleEnrollmentsService
  )

  const accessibleEnrollments =
    await getAccessibleEnrollmentsService.exec(userId)

  if (accessibleEnrollments.length === 0) {
    redirect('/course-access')
  }

  const activeAccessible = accessibleEnrollments.find(entry =>
    entry.enrollment.active
  )

  const paidAccessState: PaidAccessState = {
    hasAccess: true,
    activeEnrollment: activeAccessible
      ? toUserCourseEnrollmentApi(activeAccessible.enrollment)
      : null,
    activeCourseSlug: activeAccessible?.course.slug ?? null,
    accessExpiresAt: activeAccessible?.accessExpiresAt
      ? activeAccessible.accessExpiresAt.toISOString()
      : null,
    accessibleCourses: accessibleEnrollments.map(entry => ({
      enrollment: toUserCourseEnrollmentApi(entry.enrollment),
      accessExpiresAt: entry.accessExpiresAt
        ? entry.accessExpiresAt.toISOString()
        : null,
    })),
  }

  return (
    <PaidAccessProvider value={paidAccessState}>
      <div className="pb-[72px] flex flex-col grow">{children}</div>
    </PaidAccessProvider>
  )
}
