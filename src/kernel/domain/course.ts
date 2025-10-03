export type CourseId = string
export type CourseSlug = string
export type ContentBlockId = string

export type CourseProduct =
  | {
      access: 'free'
    }
  | {
      access: 'paid'
      price: number
      accessDurationDays: number
    }

export type ContentType = 'FIXED_COURSE' | 'SUBSCRIPTION'
