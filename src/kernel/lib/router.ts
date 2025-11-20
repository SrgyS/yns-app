import { CourseSlug } from '../domain/course'

export const getCourseOrderPath = (
  courseSlug: CourseSlug,
  urlReturn: string,
  baseUrl = ''
) => {
  const url = `${baseUrl}/order?courseSlug=${courseSlug}&urlReturn=${encodeURIComponent(
    urlReturn
  )}`

  return url
}

export const getCourseOrderSucccessPath = (baseUrl = '') => {
  const url = `${baseUrl}/order/success`

  return url
}
export const getCourseOrdereWebhookPath = (baseUrl = '') => {
  const url = `${baseUrl}/order/webhook`

  return url
}

export const getCoursePath = (courseSlug: CourseSlug, baseUrl = '') => {
  const url = `${baseUrl}/day/${courseSlug}`

  return url
}
