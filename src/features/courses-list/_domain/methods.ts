import { Course } from '@/entities/course'
import { getMinPaidTariffPrice } from '@/kernel/domain/course'
import { CourseAction } from './types'

export async function getCourseAction({
  course,
}: {
  course: Course
}): Promise<CourseAction> {
  // Если курс в черновике, показываем "скоро"
  if (course.draft) {
    return {
      type: 'comming-soon',
    }
  }

  const minPrice = getMinPaidTariffPrice(course.tariffs)
  if (minPrice !== null) {
    return {
      type: 'buy',
      price: minPrice,
    }
  }

  // Иначе можно входить
  return {
    type: 'enter',
  }
}
