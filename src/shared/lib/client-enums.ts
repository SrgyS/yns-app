export const DayOfWeek = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek]

export const DailyContentType = {
  WARMUP: 'WARMUP',
  MAIN: 'MAIN',
} as const

export type DailyContentType =
  (typeof DailyContentType)[keyof typeof DailyContentType]

export const WorkoutSection = {
  STRENGTH: 'STRENGTH',
  CORRECTION: 'CORRECTION',
  FUNCTIONAL: 'FUNCTIONAL',
  WARMUP: 'WARMUP',
  PAIN: 'PAIN',
} as const

export type WorkoutSection =
  (typeof WorkoutSection)[keyof typeof WorkoutSection]

export const WorkoutSubsection = {
  UPPER_BODY: 'UPPER_BODY',
  LOWER_BODY: 'LOWER_BODY',
  FULL_BODY: 'FULL_BODY',
  SPINE: 'SPINE',
  JOINT: 'JOINT',
  ANTI_EDEMA: 'ANTI_EDEMA',
  ANTI_TENSION: 'ANTI_TENSION',
  PELVIC_FLOOR: 'PELVIC_FLOOR',
  STRETCHING: 'STRETCHING',
  INERTIAL: 'INERTIAL',
  NECK: 'NECK',
  BACK: 'BACK',
  FEET: 'FEET',
  ABDOMEN: 'ABDOMEN',
  PELVIS_SPINE: 'PELVIS_SPINE',
  BREATHING: 'BREATHING',
  ENERGY_BOOST: 'ENERGY_BOOST',
  PILATES: 'PILATES',
  PELVIC_HIP_JOINT: 'PELVIC_HIP_JOINT',
} as const

export type WorkoutSubsection =
  (typeof WorkoutSubsection)[keyof typeof WorkoutSubsection]

export const WorkoutDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const

export type WorkoutDifficulty =
  (typeof WorkoutDifficulty)[keyof typeof WorkoutDifficulty]

export const MuscleGroup = {
  LEGS: 'LEGS',
  GLUTES: 'GLUTES',
  UPPER_BODY: 'UPPER_BODY',
  BACK: 'BACK',
  PELVIC_FLOOR: 'PELVIC_FLOOR',
  CORE: 'CORE',
} as const

export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup]

export const CourseContentType = {
  FIXED_COURSE: 'FIXED_COURSE',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const

export type CourseContentType =
  (typeof CourseContentType)[keyof typeof CourseContentType]

export const AccessType = {
  free: 'free',
  paid: 'paid',
} as const

export type AccessType = (typeof AccessType)[keyof typeof AccessType]

export const ROLE = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  USER: 'USER',
} as const

export type ROLE = (typeof ROLE)[keyof typeof ROLE]

export const ChatMessageSenderType = {
  USER: 'USER',
  STAFF: 'STAFF',
  SYSTEM: 'SYSTEM',
} as const

export type ChatMessageSenderType =
  (typeof ChatMessageSenderType)[keyof typeof ChatMessageSenderType]
