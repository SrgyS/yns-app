'use client'

import { createContext, useContext } from 'react'
import type { UserCourseEnrollmentApi } from '@/entities/course'
import type { CourseSlug } from '@/kernel/domain/course'

export type PaidAccessState = {
  hasAccess: boolean
  activeEnrollment: UserCourseEnrollmentApi | null
  activeCourseSlug: CourseSlug | null
  accessExpiresAt: string | null
  accessibleCourses: Array<{
    enrollment: UserCourseEnrollmentApi
    accessExpiresAt: string | null
  }>
}

const PaidAccessContext = createContext<PaidAccessState | null>(null)

export const PaidAccessProvider = ({
  value,
  children,
}: {
  value: PaidAccessState
  children: React.ReactNode
}) => (
  <PaidAccessContext.Provider value={value}>
    {children}
  </PaidAccessContext.Provider>
)

export const usePaidAccess = () => useContext(PaidAccessContext)
