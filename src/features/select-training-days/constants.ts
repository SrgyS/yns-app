import { DayOfWeek } from '@prisma/client'

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'пн',
  TUESDAY: 'вт',
  WEDNESDAY: 'ср',
  THURSDAY: 'чт',
  FRIDAY: 'пт',
  SATURDAY: 'сб',
  SUNDAY: 'вс',
}
