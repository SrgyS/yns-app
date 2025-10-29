import { DayOfWeek } from '@prisma/client'
import {
  ContentBlockId,
  CourseId,
  CourseSlug,
  CourseProduct,
  ContentType
} from '@/kernel/domain/course'

import { ImageSrc } from '@/shared/api/content/_lib/image'

export type Course = CourseFullInfo & {
  id: CourseId
  slug: CourseSlug
  product: Product
  allowedWorkoutDaysPerWeek: number[]
  dependencies: CourseId[]
  contentType: ContentType
}

export type Product = CourseProduct

export type CourseBaseInfo = {
  title: string
  shortDescription?: string
  thumbnail: ImageSrc
  dependencies?: CourseId[]
}

export type CourseFullInfo = CourseBaseInfo & {
  description: string
  image: ImageSrc
  draft: boolean
  durationWeeks: number
}

export interface Lesson {
  courseId: CourseId
  title: string
  shortDescription?: string
  blocks: ContentBlock[]
}

export type ContentBlock = TextBlock

export interface TextBlock {
  id: ContentBlockId
  type: 'text'
  text: string
}

export type UserCourseEnrollment = {
  id: string
  userId: string
  courseId: string
  selectedWorkoutDays: DayOfWeek[]
  startDate: Date
  hasFeedback: boolean
  active: boolean
  course: {
    id: string
    slug: string
    title: string
    durationWeeks?: number
    contentType?: ContentType
  }
}

export type UserCourseEnrollmentApi = {
  id: string
  userId: string
  courseId: string
  selectedWorkoutDays: DayOfWeek[]
  startDate: string
  hasFeedback: boolean
  active: boolean
  course?: {
    id: string
    slug: string
    title: string
  }
}

export type UserDailyPlan = {
  id: string
  userId: string
  enrollmentId: string
  date: Date
  dayNumberInCourse: number
  isWorkoutDay: boolean
  warmupId: string
  mainWorkoutId: string | null
  mealPlanId: string | null
  weekNumber: number
  originalDailyPlanId: string
  warmupStepIndex: number
  mainWorkoutStepIndex: number | null
}

export type CreateUserCourseEnrollmentParams = {
  userId: string
  courseId: string
  courseContentType: ContentType
  startDate: Date
  selectedWorkoutDays: DayOfWeek[]
  hasFeedback?: boolean
}

export type GetUserDailyPlanParams = {
  userId: string
  courseId: string
  dayNumberInCourse: number
}

export type GetUserDailyPlanByEnrollmentParams = {
  enrollmentId: string
  dayNumberInCourse: number
}
