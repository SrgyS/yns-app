'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { CourseSlug } from '@/kernel/domain/course'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'
import {
  isCourseAccessState,
  useCheckAccessByCourseSlugQuery,
} from './use-course-enrollment'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { usePaidAccess } from './paid-access-context'

export function CheckAccessGuard({
  children,
  courseSlug,
}: {
  children: React.ReactNode
  courseSlug: CourseSlug
}) {
  const paidAccess = usePaidAccess()
  const { data: session, status } = useAppSession()
  // Removed useCourseEnrollment

  const userId = session?.user?.id ?? ''
  const accessibleEntry = paidAccess?.accessibleCourses.find(
    entry => entry.enrollment.course?.slug === courseSlug
  )
  const hasServerAccess = Boolean(accessibleEntry)

  const shouldFetch =
    !hasServerAccess && status === 'authenticated' && Boolean(userId)

  const { data, error, isError, isSuccess, isPending } =
    useCheckAccessByCourseSlugQuery(userId, courseSlug, {
      enabled: shouldFetch,
    })

  useEffect(() => {
    if (hasServerAccess || !shouldFetch) {
      return
    }

    if (isError) {
      const message = error instanceof Error ? error.message : 'Ошибка доступа'
      toast.error(message)
      return
    }

    if (isSuccess) {
      const accessData = isCourseAccessState(data) ? data : undefined
      const hasAccess = accessData?.hasAccess ?? false
      const enrollment = accessData?.enrollment
      if (!hasAccess || !enrollment) {
        toast.error('У вас нет доступа к этому курсу')
      }
    }
  }, [
    shouldFetch,
    isError,
    isSuccess,
    error,
    data,
    hasServerAccess,
    courseSlug,
  ])

  const isLoading = status === 'loading' || (shouldFetch && isPending)

  const canRenderChildren =
    status === 'authenticated' &&
    (hasServerAccess || !shouldFetch || isSuccess || isError)

  return (
    <>
      <FullPageSpinner isLoading={isLoading} />
      {canRenderChildren ? children : null}
    </>
  )
}
