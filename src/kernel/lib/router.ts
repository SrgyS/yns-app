import { CourseSlug } from '../domain/course'

export const getCourseOrderPath = (
  courseSlug: CourseSlug,
  urlReturn: string,
  baseUrl = ''
) => {
  const url = `${baseUrl}/platform/order?courseSlug=${courseSlug}&urlReturn=${encodeURIComponent(
    urlReturn
  )}`

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
