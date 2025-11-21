import { CourseId, CourseSlug } from '@/kernel/domain/course'

export type CourseAction =
  | { type: 'comming-soon' }
  | { type: 'buy'; price: number }
  | { type: 'setup' }
  | {
      type: 'enter'
    }

export type CourseDetails = {
  id: CourseId
  slug: CourseSlug
  title: string
  description: string
  image: string
}
