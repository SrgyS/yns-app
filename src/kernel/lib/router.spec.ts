import {
  getCourseOrderPath,
  getCourseOrderSucccessPath,
  getCourseOrdereWebhookPath,
  getCoursePath,
  getCoursePublicPath,
} from './router'

describe('course router paths', () => {
  test('builds order and course urls with baseUrl and params', () => {
    const orderUrl = getCourseOrderPath(
      'course-1',
      'https://return.example.com',
      'https://app.example.com',
      'tariff-1'
    )

    expect(orderUrl).toBe(
      'https://app.example.com/platform/order?courseSlug=course-1&urlReturn=https%3A%2F%2Freturn.example.com&tariffId=tariff-1'
    )

    expect(getCourseOrderSucccessPath('https://app.example.com')).toBe(
      'https://app.example.com/platform/order/success'
    )
    expect(getCourseOrdereWebhookPath('https://app.example.com')).toBe(
      'https://app.example.com/platform/order/webhook'
    )
    expect(getCoursePath('slug', 'https://app.example.com')).toBe(
      'https://app.example.com/platform/day/slug'
    )
    expect(getCoursePublicPath('slug', 'https://app.example.com')).toBe(
      'https://app.example.com/courses/slug'
    )
  })
})
