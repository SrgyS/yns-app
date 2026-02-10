import { DayOfWeek } from '@prisma/client'

import type { UserCourseEnrollment } from '@/entities/course'
import { toUserCourseEnrollmentApi } from './map-user-course-enrollment'

describe('toUserCourseEnrollmentApi', () => {
  test('maps enrollment to api shape', () => {
    const startDate = new Date('2024-01-02T03:04:05.000Z')
    const enrollment: UserCourseEnrollment = {
      id: 'enroll-1',
      userId: 'user-1',
      courseId: 'course-1',
      selectedWorkoutDays: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
      startDate,
      hasFeedback: true,
      active: true,
      course: {
        id: 'course-1',
        slug: 'course-1',
        title: 'Course One',
      },
    }

    const result = toUserCourseEnrollmentApi(enrollment)

    expect(result).toEqual({
      id: 'enroll-1',
      userId: 'user-1',
      courseId: 'course-1',
      selectedWorkoutDays: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
      startDate: startDate.toISOString(),
      hasFeedback: true,
      active: true,
      course: {
        id: 'course-1',
        slug: 'course-1',
        title: 'Course One',
      },
    })
  })
})
