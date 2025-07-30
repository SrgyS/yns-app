import { CourseId, CourseSlug } from "@/kernel/domain/course";
import { CompletionStatus, DayOfWeek } from '@prisma/client'

export type Course ={
  id: CourseId;
  slug: CourseSlug;
  title: string;
  description: string;
  shortDescription?:string;
  thumbnail: string;
  image: string;
  draft: boolean;
  durationWeeks: number;
  // Теперь это массив ID курсов, от которых зависит данный курс
  dependencies: CourseId[];
  product?: CourseProduct;
}
export type CourseProduct =
  | {
      access: "free";
    }
  | {
      access: "paid";
      price: number;
    };

    export type UserCourseEnrollment = {
      id: string
      userId: string
      courseId: string
      selectedWorkoutDays: DayOfWeek[]
      startDate: Date
      hasFeedback: boolean
    }

    export type UserDailyPlan = {
      id: string
      userId: string
      enrollmentId: string
      date: Date
      dayNumberInCourse: number
      isWorkoutDay: boolean
      warmupId: string
      mainWorkoutId?: string
      mealPlanId: string
      warmupProgress: CompletionStatus
      mainWorkoutProgress: CompletionStatus
      mealPlanProgress: CompletionStatus
    }

    export type CreateUserCourseEnrollmentParams = {
      userId: string
      courseId: string
      startDate: Date
      selectedWorkoutDays: DayOfWeek[]
      hasFeedback?: boolean
    }

    export type GetUserDailyPlanParams = {
      userId: string
      date: Date
    }

    export type GetUserDailyPlanByEnrollmentParams = {
      enrollmentId: string
      date: Date
    }    