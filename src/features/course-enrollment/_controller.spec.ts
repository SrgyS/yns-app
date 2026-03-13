import { DayOfWeek } from '@prisma/client'

jest.mock('@/kernel/lib/trpc/module', () => {
  const procedureModule = jest.requireActual('@/kernel/lib/trpc/_procedure')

  class Controller {}

  return {
    ...procedureModule,
    Controller,
  }
})

jest.mock('@/entities/course/module', () => ({}))
jest.mock('@/entities/user-access/module', () => ({}))
jest.mock('@/entities/user-access/_repository/user-access', () => ({}))
jest.mock('./_services/create-user-course-enrollment-with-access', () => ({}))
jest.mock('./_services/get-available-weeks', () => ({}))
jest.mock('./_services/get-accessible-enrollments', () => ({}))
jest.mock('./_services/get-course-enrollment', () => ({}))
jest.mock('./_services/get-user-enrollments', () => ({}))
jest.mock('./_services/get-enrollment-by-course-slug', () => ({}))
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))
jest.mock('./_lib/map-user-course-enrollment', () => ({
  toUserCourseEnrollmentApi: jest.fn((value: unknown) => value),
}))

import { CourseEnrollmentController } from './_controller'

const session = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER' as const,
    name: null,
    image: null,
  },
  expires: '2099-01-01T00:00:00.000Z',
}

const requestMeta = {
  requestUrl: 'https://app.local/api/trpc',
  method: 'POST',
  origin: 'https://app.local',
  referer: 'https://app.local/platform',
  host: 'app.local',
  forwardedHost: null,
  forwardedProto: 'https',
}

describe('CourseEnrollmentController', () => {
  test('updateWorkoutDays forbids editing another user enrollment', async () => {
    const getEnrollmentByIdService = {
      exec: jest.fn().mockResolvedValue({
        id: 'enrollment-1',
        userId: 'other-user',
      }),
    }
    const updateWorkoutDaysService = {
      exec: jest.fn(),
    }

    const controller = new CourseEnrollmentController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      updateWorkoutDaysService as never,
      {} as never,
      {} as never,
      getEnrollmentByIdService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    )

    const caller = controller.router.createCaller({ session, requestMeta })

    let code: string | null = null
    try {
      await caller.course.updateWorkoutDays({
        enrollmentId: 'enrollment-1',
        selectedWorkoutDays: [DayOfWeek.MONDAY],
        keepProgress: false,
      })
    } catch (error) {
      code = (error as { code?: string }).code ?? null
    }

    expect(code).toBe('FORBIDDEN')
    expect(updateWorkoutDaysService.exec).not.toHaveBeenCalled()
  })

  test('updateWorkoutDays allows editing own enrollment', async () => {
    const getEnrollmentByIdService = {
      exec: jest.fn().mockResolvedValue({
        id: 'enrollment-1',
        userId: 'user-1',
      }),
    }
    const updateWorkoutDaysService = {
      exec: jest.fn().mockResolvedValue({
        id: 'enrollment-1',
        selectedWorkoutDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      }),
    }

    const controller = new CourseEnrollmentController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      updateWorkoutDaysService as never,
      {} as never,
      {} as never,
      getEnrollmentByIdService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    )

    const caller = controller.router.createCaller({ session, requestMeta })

    await caller.course.updateWorkoutDays({
      enrollmentId: 'enrollment-1',
      selectedWorkoutDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      keepProgress: true,
    })

    expect(updateWorkoutDaysService.exec).toHaveBeenCalledWith({
      enrollmentId: 'enrollment-1',
      selectedWorkoutDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      keepProgress: true,
    })
  })
})
