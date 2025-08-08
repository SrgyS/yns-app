import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { UserCourseEnrollment, CreateUserCourseEnrollmentParams } from '../../course'
import { logger } from '@/shared/lib/logger'
import {
  UserCourseEnrollment as PrismaUserCourseEnrollment,
  DayOfWeek,
  Prisma,
} from '@prisma/client'

@injectable()
export class UserCourseEnrollmentRepository {
  private mapPrismaEnrollmentToDomain(
    prismaEnrollment: PrismaUserCourseEnrollment
  ): UserCourseEnrollment {
    return {
      id: prismaEnrollment.id,
      userId: prismaEnrollment.userId,
      courseId: prismaEnrollment.courseId,
      selectedWorkoutDays: prismaEnrollment.selectedWorkoutDays,
      startDate: prismaEnrollment.startDate,
      hasFeedback: prismaEnrollment.hasFeedback,
      active: prismaEnrollment.active,
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

  async getUserEnrollments(userId: string): Promise<UserCourseEnrollment[]> {
    try {
      const enrollments = await dbClient.userCourseEnrollment.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
      })

      return enrollments.map(this.mapPrismaEnrollmentToDomain.bind(this))
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
    userId: string,
    selectedWorkoutDays: DayOfWeek[]
  ): Promise<number> {
    try {
      const result = await dbClient.userCourseEnrollment.updateMany({
        where: { userId: userId },
        data: {
          selectedWorkoutDays,
        },
      })

      return result.count
    } catch (error) {
      logger.error({
        msg: 'Error updating selected workout days',
        userId,
        selectedWorkoutDays,
        error,
      })
      throw new Error('Failed to update selected workout days')
    }
  }

  async getUserWorkoutDays(userId: string, courseId: string): Promise<DayOfWeek[]> {
    const enrollment = await this.getEnrollment(userId, courseId)
    return enrollment?.selectedWorkoutDays ?? []
  }

  async getActiveEnrollment(userId: string): Promise<UserCourseEnrollment | null> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findFirst({
        where: { 
          userId: userId,
          active: true 
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

  async deactivateUserEnrollments(userId: string): Promise<number> {
    try {
      const result = await dbClient.userCourseEnrollment.updateMany({
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

  async activateEnrollment(enrollmentId: string): Promise<UserCourseEnrollment> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.update({
        where: { id: enrollmentId },
        data: { active: true },
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
    params: CreateUserCourseEnrollmentParams
  ): Promise<UserCourseEnrollment> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.create({
        data: {
          userId: params.userId,
          courseId: params.courseId,
          startDate: params.startDate,
          selectedWorkoutDays: params.selectedWorkoutDays,
          hasFeedback: params.hasFeedback ?? false,
          active: true,
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
      if (error instanceof Error && 'code' in (error as any) && (error as any).code === 'P2002') {
        throw new Error('Запись на этот курс уже существует')
      }
      
      // Для других типов ошибок возвращаем общее сообщение
      throw new Error('Ошибка при создании записи на курс')
    }
  }

  // Новый метод для создания enrollment в рамках транзакции
  async createEnrollmentWithTransaction(
    params: CreateUserCourseEnrollmentParams,
    tx: Prisma.TransactionClient // Используйте правильный тип для транзакции Prisma
  ): Promise<UserCourseEnrollment> { // Возвращаем Prisma-объект
    try {
      return await tx.userCourseEnrollment.create({
        data: {
          userId: params.userId,
          courseId: params.courseId,
          startDate: params.startDate,
          selectedWorkoutDays: params.selectedWorkoutDays,
          hasFeedback: params.hasFeedback ?? false,
          active: true,
        },
      })
    } catch (error) {
      logger.error({
        msg: 'Error creating user course enrollment in transaction',
        params,
        error,
      })
      
      // Проверяем, является ли ошибка ошибкой уникальности Prisma
      if (error instanceof Error && 'code' in (error as any) && (error as any).code === 'P2002') {
        throw new Error('Запись на этот курс уже существует')
      }
      
      // Для других типов ошибок возвращаем общее сообщение
      throw new Error('Ошибка при создании записи на курс')
    }
  }
}