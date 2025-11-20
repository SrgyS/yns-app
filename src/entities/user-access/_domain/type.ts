import { ContentType } from '@/kernel/domain/course'

export type CourseAccessReason = 'paid' | 'free' | 'manual'

export type CourseUserAccess = {
  id: string
  contentType: ContentType
  userId: string
  courseId: string
  reason: CourseAccessReason
  adminId?: string
  enrollmentId?: string | null
  expiresAt?: Date | null
  setupCompleted: boolean
}

export type UserAccess = CourseUserAccess
