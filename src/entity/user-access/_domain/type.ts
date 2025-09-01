export type CourseAccessReason = 'paid' | 'free' | 'manual'
export type UserAccessType = 'fixed' | 'subscription'

export type CourseUserAccess = {
  id: string
  type: UserAccessType
  userId: string
  courseId: string
  reason: CourseAccessReason
  adminId?: string
  enrollmentId?: string | null
}

export type UserAccess = CourseUserAccess
