import { DayOfWeek } from '@prisma/client'
import {
  ContentBlockId,
  CourseId,
  CourseSlug,
  CourseProduct,
  ContentType,
} from '@/kernel/domain/course'

import { ImageSrc } from '@/shared/api/content/_lib/image'
import { CourseContentType } from '@/entities/payment/_domain/types'

export type Course = CourseFullInfo & {
  id: CourseId
  slug: CourseSlug
  product: Product
  allowedWorkoutDaysPerWeek: number[]
  dependencies: CourseId[]
  contentType: ContentType
  showRecipes: boolean
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
  showRecipes?: boolean
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

export type CourseAccessInfo = {
  id: CourseId
  slug: CourseSlug
  title: string
  contentType: ContentType
  product: CourseProduct
}

export type MainWorkoutEntry = {
  workoutId: string
  order: number
  stepIndex: number
}

export type UserDailyPlan = {
  id: string
  userId: string
  enrollmentId: string
  date: Date
  dayNumberInCourse: number
  isWorkoutDay: boolean
  warmupId: string
  mainWorkouts: MainWorkoutEntry[]
  mealPlanId: string | null
  weekNumber: number
  originalDailyPlanId: string
  warmupStepIndex: number
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
  enrollmentId: string
  dayNumberInCourse: number
}

export type GetUserDailyPlanByEnrollmentParams = {
  enrollmentId: string
  dayNumberInCourse: number
}

export type CreateCourseInput = {
  title: string
  slug: string
  description: string
  shortDescription?: string
  thumbnail: string
  image: string
  durationWeeks: number
  contentType: CourseContentType
  product: {
    access: string
    price: number
  }
}
