export type CourseAccessReason = 'paid' | 'free' | 'manual'
export type UserAccessType = 'fixed' | 'subscription'

export type CourseUserAccess = {
  id: string
  type: UserAccessType
  userId: string
  courseId: string
  reason: CourseAccessReason
  adminId?: string
}

export type UserAccess = CourseUserAccess
