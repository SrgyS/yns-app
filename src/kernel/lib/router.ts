import { CourseSlug } from '../domain/course'

export const getCourseOrderPath = (
  courseSlug: CourseSlug,
  urlReturn: string,
  baseUrl = '',
  tariffId?: string
) => {
  const params = new URLSearchParams({
    courseSlug,
    urlReturn,
  })

  if (tariffId) {
    params.set('tariffId', tariffId)
  }

  const url = `${baseUrl}/platform/order?${params.toString()}`

  return url
}

export const getCourseOrderSucccessPath = (baseUrl = '') => {
  const url = `${baseUrl}/platform/order/success`

  return url
}
export const getCourseOrdereWebhookPath = (baseUrl = '') => {
  const url = `${baseUrl}/platform/order/webhook`

  return url
}

export const getCoursePath = (courseSlug: CourseSlug, baseUrl = '') => {
  const url = `${baseUrl}/platform/day/${courseSlug}`

  return url
}

export const getCoursePublicPath = (courseSlug: CourseSlug, baseUrl = '') => {
  const url = `${baseUrl}/courses/${courseSlug}`

  return url
}
