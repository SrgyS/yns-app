import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import {
  UserCourseEnrollment,
  CreateUserCourseEnrollmentParams,
} from '../../course'
import { logger } from '@/shared/lib/logger'
import {
  UserCourseEnrollment as PrismaUserCourseEnrollment,
  DayOfWeek,
  Prisma,
  PrismaClient,
} from '@prisma/client'

type DbClient = PrismaClient | Prisma.TransactionClient

@injectable()
export class UserCourseEnrollmentRepository {
  constructor(private readonly defaultDb: DbClient = dbClient) {}

  private mapPrismaEnrollmentToDomain(
    prismaEnrollment: PrismaUserCourseEnrollment & {
      course: {
        id: string
        slug: string
        title: string
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
      },
    }
  }

  async getEnrollment(
    userId: string,
    courseId: string
  ): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        include: {
          course: { select: { id: true, slug: true, title: true } },
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
          course: { select: { id: true, slug: true, title: true } },
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
    courseSlug: string
  ): Promise<UserCourseEnrollment | null> {
    try {
      // Сначала получаем курс по slug
      const course = await dbClient.course.findUnique({
        where: { slug: courseSlug },
      })

      if (!course) {
        return null
      }

      // Затем получаем enrollment по userId и courseId
      const enrollment = await dbClient.userCourseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
        include: {
          course: { select: { id: true, slug: true, title: true } },
        },
      })

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

  async getUserEnrollments(userId: string): Promise<UserCourseEnrollment[]> {
    try {
      const enrollments = await dbClient.userCourseEnrollment.findMany({
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
          course: { select: { id: true, slug: true, title: true } },
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

  async activateEnrollment(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserCourseEnrollment> {
    try {
      const enrollment = await db.userCourseEnrollment.update({
        where: { id: enrollmentId },
        data: { active: true },
        include: {
          course: { select: { id: true, slug: true, title: true } },
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

  // Существующий метод createEnrollment остается для обратной совместимости
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
          active: true,
        },
        include: {
          course: { select: { id: true, slug: true, title: true } },
        },
      })

      return this.mapPrismaEnrollmentToDomain(enrollment)
    } catch (error) {
      logger.error({
        msg: 'Error creating user course enrollment',
        params,
        error,
      })

      // Проверяем, является ли ошибка ошибкой уникальности Prisma
      if (
        error instanceof Error &&
        'code' in (error as any) &&
        (error as any).code === 'P2002'
      ) {
        throw new Error('Запись на этот курс уже существует')
      }

      // Для других типов ошибок возвращаем общее сообщение
      throw new Error('Ошибка при создании записи на курс')
    }
  }

  // async getActiveEnrollmentWithCourseDetails(
  //   userId: string,
  //   tx: Prisma.TransactionClient
  // ) {
  //   try {
  //     return await tx.userCourseEnrollment.findFirst({
  //       where: {
  //         userId: userId,
  //         active: true,
  //       },
  //       include: {
  //         course: {
  //           include: {
  //             dailyPlans: {
  //               include: {
  //                 warmup: true,
  //                 mainWorkout: true,
  //                 mealPlan: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     })
  //   } catch (error) {
  //     logger.error({
  //       msg: 'Error getting active enrollment with course details',
  //       userId,
  //       error,
  //     })
  //     throw new Error('Failed to get active enrollment with course details')
  //   }
  // }
}
