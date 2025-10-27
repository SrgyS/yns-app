'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CourseSlug } from '@/kernel/domain/course'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'
import {
  isCourseAccessState,
  useCourseEnrollment,
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
  const router = useRouter()
  const redirectInitiatedRef = useRef(false)
  const paidAccess = usePaidAccess()
  const { data: session, status } = useAppSession()
  const { checkAccessByCourseSlug } = useCourseEnrollment()

  const userId = session?.user?.id ?? ''
  const accessibleEntry = paidAccess?.accessibleCourses.find(
    entry => entry.enrollment.course?.slug === courseSlug
  )
  const hasServerAccess = Boolean(accessibleEntry)

  const shouldFetch =
    !hasServerAccess && status === 'authenticated' && Boolean(userId)

  const {
    data,
    error,
    isError,
    isSuccess,
    isPending,
  } = checkAccessByCourseSlug(userId, courseSlug, {
    enabled: shouldFetch,
  })

  useEffect(() => {
    if (hasServerAccess || !shouldFetch || redirectInitiatedRef.current) {
      return
    }

    if (isError) {
      const message =
        error instanceof Error ? error.message : 'Ошибка доступа'
      toast.error(message)
      redirectInitiatedRef.current = true
      router.replace('/course-access')
      return
    }

    if (isSuccess) {
      const accessData = isCourseAccessState(data) ? data : undefined
      const hasAccess = accessData?.hasAccess ?? false
      const enrollment = accessData?.enrollment
      if (!hasAccess || !enrollment) {
        toast.error('У вас нет доступа к этому курсу')
        redirectInitiatedRef.current = true
        router.replace('/course-access')
      }
    }
  }, [
    shouldFetch,
    isError,
    isSuccess,
    error,
    data,
    router,
    courseSlug,
    hasServerAccess,
  ])

  const isLoading =
    status === 'loading' || (shouldFetch && isPending)

  const canRenderChildren =
    hasServerAccess ||
    (status === 'authenticated' &&
      isSuccess &&
      !redirectInitiatedRef.current &&
      Boolean(
        isCourseAccessState(data) &&
          data.hasAccess &&
          data.enrollment
      ))

  return (
    <>
      <FullPageSpinner isLoading={isLoading} />
      {canRenderChildren ? children : null}
    </>
  )
}
