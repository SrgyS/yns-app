import {
  ContentBlockId,
  CourseId,
  CourseSlug,
  LessonId,
  LessonSlug,
} from '@/kernel/domain/course'
import { ImageSrc } from '@/shared/api/content/_lib/image'
export type Product =
  | {
      access: 'free'
    }
  | {
      access: 'paid'
      price: number
    }

export type Course = {
  id: CourseId
  slug: CourseSlug
  title: string
  description: string
  shortDescription?: string
  thumbnail: ImageSrc
  image: ImageSrc
  dependencies?: CourseId[]
  // lessonsSlugs: LessonSlug[]
  product: Product
  //   reviewsCount: number
}

export interface Lesson {
  id: LessonId
  slug: LessonSlug
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
