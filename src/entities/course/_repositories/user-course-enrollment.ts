import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import type { DbClient } from '@/shared/lib/db'
import {
  UserCourseEnrollment,
  CreateUserCourseEnrollmentParams,
} from '..'
import { logger } from '@/shared/lib/logger'
import {
  UserCourseEnrollment as PrismaUserCourseEnrollment,
  DayOfWeek,
  CourseContentType,
} from '@prisma/client'

const LOG_PREFIX = '[UserCourseEnrollmentRepository]'

async function logTiming<T>(label: string, action: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    return await action()
  } finally {
    const duration = Date.now() - start
    logger.info({
      msg: `${LOG_PREFIX} ${label}`,
      durationMs: duration,
    })
  }
}

@injectable()
export class UserCourseEnrollmentRepository {
  constructor(private readonly defaultDb: DbClient = dbClient) {}

  private mapPrismaEnrollmentToDomain(
    prismaEnrollment: PrismaUserCourseEnrollment & {
      course: {
        id: string
        slug: string
        title: string
        durationWeeks?: number
        contentType?: CourseContentType
      }
    }
  ): UserCourseEnrollment {
    return {
      id: prismaEnrollment.id,
      userId: prismaEnrollment.userId,
      courseId: prismaEnrollment.courseId,
      selectedWorkoutDays: prismaEnrollment.selectedWorkoutDays,
      startDate: prismaEnrollment.startDate,
      hasFeedback: prismaEnrollment.hasFeedback,
      active: prismaEnrollment.active,
      course: {
        id: prismaEnrollment.course.id,
        slug: prismaEnrollment.course.slug,
        title: prismaEnrollment.course.title,
        durationWeeks: prismaEnrollment.course.durationWeeks,
        contentType: prismaEnrollment.course.contentType,
      },
    }
  }

  async getEnrollment(
    userId: string,
    courseId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await db.userCourseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              durationWeeks: true,
              contentType: true,
            },
          },
        },
      })

      return enrollment ? this.mapPrismaEnrollmentToDomain(enrollment) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting user course enrollment',
        userId,
        courseId,
        error,
      })
      throw new Error('Failed to get enrollment')
    }
  }

  async getEnrollmentById(
    enrollmentId: string
  ): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              durationWeeks: true,
              contentType: true,
            },
          },
        },
      })

      return enrollment ? this.mapPrismaEnrollmentToDomain(enrollment) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting enrollment by id',
        enrollmentId,
        error,
      })
      throw new Error('Failed to get enrollment')
    }
  }

  async getEnrollmentByUserIdAndCourseSlug(
    userId: string,
    courseSlug: string,
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await logTiming(
        'userCourseEnrollment.findFirstBySlug',
        () =>
          db.userCourseEnrollment.findFirst({
            where: {
              userId,
              course: {
                slug: courseSlug,
              },
            },
            include: {
              course: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  durationWeeks: true,
                  contentType: true,
                },
              },
            },
          })
      )

      return enrollment ? this.mapPrismaEnrollmentToDomain(enrollment) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting user course enrollment by slug',
        userId,
        courseSlug,
        error,
      })
      throw new Error('Failed to get enrollment by slug')
    }
  }

  async getUserEnrollments(
    userId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment[]> {
    try {
      const enrollments = await db.userCourseEnrollment.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        include: {
          course: true,
        },
      })

      return enrollments.map(enrollment => ({
        ...this.mapPrismaEnrollmentToDomain(enrollment),
        course: {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          title: enrollment.course.title,
          durationWeeks: enrollment.course.durationWeeks,
          contentType: enrollment.course.contentType,
        },
      }))
    } catch (error) {
      logger.error({
        msg: 'Error getting user enrollments',
        userId,
        error,
      })
      throw new Error('Failed to get user enrollments')
    }
  }

  async updateSelectedWorkoutDays(
    enrollmentId: string,
    selectedWorkoutDays: DayOfWeek[],
    db: DbClient = this.defaultDb
  ): Promise<number> {
    try {
      const result = await db.userCourseEnrollment.updateMany({
        where: { id: enrollmentId },
        data: {
          selectedWorkoutDays,
        },
      })

      return result.count
    } catch (error) {
      logger.error({
        msg: 'Error updating selected workout days',
        enrollmentId,
        selectedWorkoutDays,
        error,
      })
      throw new Error('Failed to update selected workout days')
    }
  }

  async getUserWorkoutDays(
    userId: string,
    courseId: string
  ): Promise<DayOfWeek[]> {
    const enrollment = await this.getEnrollment(userId, courseId)
    return enrollment?.selectedWorkoutDays ?? []
  }

  async getActiveEnrollment(
    userId: string
  ): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findFirst({
        where: {
          userId: userId,
          active: true,
        },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              durationWeeks: true,
              contentType: true,
            },
          },
        },
      })

      return enrollment ? this.mapPrismaEnrollmentToDomain(enrollment) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting active enrollment',
        userId,
        error,
      })
      throw new Error('Failed to get active enrollment')
    }
  }

  async deactivateUserEnrollments(
    userId: string,
    db: DbClient = this.defaultDb
  ): Promise<number> {
    try {
      const result = await db.userCourseEnrollment.updateMany({
        where: { userId: userId },
        data: {
          active: false,
        },
      })

      return result.count
    } catch (error) {
      logger.error({
        msg: 'Error deactivating user enrollments',
        userId,
        error,
      })
      throw new Error('Failed to deactivate user enrollments')
    }
  }

  async updateEnrollmentOnClose(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ) {
    await db.userCourseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        active: false,
        selectedWorkoutDays: [],
      },
    })
  }

  async activateEnrollment(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment> {
    try {
      const enrollment = await db.userCourseEnrollment.update({
        where: { id: enrollmentId },
        data: { active: true },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              durationWeeks: true,
              contentType: true,
            },
          },
        },
      })

      return this.mapPrismaEnrollmentToDomain(enrollment)
    } catch (error) {
      logger.error({
        msg: 'Error activating enrollment',
        enrollmentId,
        error,
      })
      throw new Error('Failed to activate enrollment')
    }
  }

  async reactivateEnrollment(
    enrollmentId: string,
    params: {
      startDate: Date
      selectedWorkoutDays: DayOfWeek[]
      hasFeedback?: boolean
    },
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment> {
    try {
      const enrollment = await db.userCourseEnrollment.update({
        where: { id: enrollmentId },
        data: {
          active: true,
          startDate: params.startDate,
          selectedWorkoutDays: params.selectedWorkoutDays,
          hasFeedback: params.hasFeedback ?? false,
        },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              durationWeeks: true,
              contentType: true,
            },
          },
        },
      })

      return this.mapPrismaEnrollmentToDomain(enrollment)
    } catch (error) {
      logger.error({
        msg: 'Error reactivating enrollment',
        enrollmentId,
        params,
        error,
      })
      throw new Error('Failed to reactivate enrollment')
    }
  }

  async createEnrollment(
    params: CreateUserCourseEnrollmentParams,
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment> {
    try {
      const enrollment = await db.userCourseEnrollment.create({
        data: {
          userId: params.userId,
          courseId: params.courseId,
          startDate: params.startDate,
          selectedWorkoutDays: params.selectedWorkoutDays,
          hasFeedback: params.hasFeedback ?? false,
        },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              durationWeeks: true,
              contentType: true,
            },
          },
        },
      })

      return this.mapPrismaEnrollmentToDomain(enrollment)
    } catch (error) {
      logger.error({
        msg: 'Error creating enrollment',
        params,
        error,
      })
      throw new Error('Failed to create enrollment')
    }
  }
}
