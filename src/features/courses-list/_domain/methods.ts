import { Course } from '@/entities/course'
import { CourseAction } from './types'

export async function getCourseAction({
  course,
  hasAccess,
  needsSetup,
}: {
  course: Course
  hasAccess?: boolean
  needsSetup?: boolean
}): Promise<CourseAction> {
  if (hasAccess && needsSetup) {
    return {
      type: 'setup',
    }
  }

  if (!hasAccess && course.product && course.product.access === 'paid') {
    return {
      type: 'buy',
      price: course.product.price,
    }
  }

  // Если курс в черновике, показываем "скоро"
  if (course.draft) {
    return {
      type: 'comming-soon',
    }
  }

  // Иначе можно входить
  return {
    type: 'enter',
  }
}
