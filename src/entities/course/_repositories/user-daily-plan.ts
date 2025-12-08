import {
  DayOfWeek,
  UserDailyPlan as PrismaUserDailyPlan,
  UserDailyMainWorkout,
} from '@prisma/client'
import { dbClient } from '@/shared/lib/db'
import type { DbClient } from '@/shared/lib/db'
import {
  GetUserDailyPlanByEnrollmentParams,
  UserDailyPlan,
  MainWorkoutEntry,
} from '..'
import { logger } from '@/shared/lib/logger'
import { PlanningRepository } from '../../planning'

// const LOG_PREFIX = '[UserDailyPlanRepository]'

// async function logTiming<T>(
//   label: string,
//   action: () => Promise<T>
// ): Promise<T> {
//   const start = Date.now()
//   try {
//     return await action()
//   } finally {
//     const duration = Date.now() - start
//     logger.info({
//       msg: `${LOG_PREFIX} ${label}`,
//       durationMs: duration,
//     })
//   }
// }

export class UserDailyPlanRepository {
  private readonly planningRepository: PlanningRepository

  constructor(private readonly defaultDb: DbClient = dbClient) {
    this.planningRepository = new PlanningRepository(defaultDb)
  }
  private toDomain(
    prismaUserDailyPlan: PrismaUserDailyPlan & {
      mainWorkouts?: UserDailyMainWorkout[]
    }
  ): UserDailyPlan {
    return {
      id: prismaUserDailyPlan.id,
      userId: prismaUserDailyPlan.userId,
      enrollmentId: prismaUserDailyPlan.enrollmentId,
      date: prismaUserDailyPlan.date,
      dayNumberInCourse: prismaUserDailyPlan.dayNumberInCourse,
      isWorkoutDay: prismaUserDailyPlan.isWorkoutDay,
      warmupId: prismaUserDailyPlan.warmupId,
      mainWorkouts:
        prismaUserDailyPlan.mainWorkouts?.map<MainWorkoutEntry>(main => ({
          workoutId: main.workoutId,
          order: main.order,
          stepIndex: main.stepIndex,
        })) ?? [],
      mealPlanId: prismaUserDailyPlan.mealPlanId,
      weekNumber: prismaUserDailyPlan.weekNumber,
      originalDailyPlanId: prismaUserDailyPlan.originalDailyPlanId,
      warmupStepIndex: prismaUserDailyPlan.warmupStepIndex,
    }
  }

  async generateUserDailyPlansForEnrollment(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    try {
      const result = await this.planningRepository.generateUserDailyPlans(
        enrollmentId,
        { scope: 'full' },
        db
      )

      logger.info({
        msg: 'Generated user daily plans for enrollment',
        enrollmentId,
        plansCount: result.length,
      })

      return result
    } catch (error) {
      logger.error({
        msg: 'Error generating user daily plans for enrollment',
        enrollmentId,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      })
      throw error instanceof Error
        ? error
        : new Error('Failed to generate user daily plans')
    }
  }

  async generateUserDailyPlansForWeek(
    enrollmentId: string,
    weekNumber: number,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    try {
      const result =
        await this.planningRepository.generateUserDailyPlansForWeek(
          enrollmentId,
          weekNumber,
          db
        )

      logger.info({
        msg: 'Generated user daily plans for week',
        enrollmentId,
        weekNumber,
        plansCount: result.length,
      })

      return result
    } catch (error) {
      logger.error({
        msg: 'Error generating user daily plans for week',
        enrollmentId,
        weekNumber,
        error,
      })
      throw new Error('Failed to generate user daily plans for week')
    }
  }

  async getUserDailyPlanByEnrollment(
    params: GetUserDailyPlanByEnrollmentParams,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan | null> {
    try {
      const userDailyPlan = await db.userDailyPlan.findFirst({
        where: {
          enrollmentId: params.enrollmentId,
          dayNumberInCourse: params.dayNumberInCourse,
        },
        include: {
          mainWorkouts: true,
        },
      })

      return userDailyPlan ? this.toDomain(userDailyPlan) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting user daily plan by enrollment',
        params,
        error,
      })
      throw new Error('Failed to get user daily plan')
    }
  }

  async getUserDailyPlansByEnrollment(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    try {
      const userDailyPlans = await db.userDailyPlan.findMany({
        where: { enrollmentId },
        orderBy: { dayNumberInCourse: 'asc' },
        include: {
          mainWorkouts: true,
        },
      })

      return userDailyPlans.map(this.toDomain.bind(this))
    } catch (error) {
      logger.error({
        msg: 'Error getting user daily plans by enrollment',
        enrollmentId,
        error,
      })
      throw new Error('Failed to get user daily plans')
    }
  }

  async deleteByEnrollment(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<number> {
    try {
      const result = await db.userDailyPlan.deleteMany({
        where: { enrollmentId },
      })

      logger.info({
        msg: 'Deleted user daily plans for enrollment',
        enrollmentId,
        deletedCount: result.count,
      })

      return result.count
    } catch (error) {
      logger.error({
        msg: 'Error deleting user daily plans',
        enrollmentId,
        error,
      })
      throw new Error('Failed to delete user daily plans')
    }
  }

  /**
   * Возвращает агрегированную информацию по расписанию пользователя.
   *
   * @param enrollmentId - идентификатор записи пользователя на курс
   * @param db - опциональный Prisma-клиент или транзакция; по умолчанию общий `dbClient`
   *
   * @returns объект со сведениями:
   * - `totalWeeks` — максимальный номер недели (`weekNumber`) в расписании;
   * - `activeWeeks` — количество уникальных недель, для которых уже созданы планы;
   * - `distinctWeeks` — отсортированный список таких недель;
   * - `totalDays` — общее количество записей `UserDailyPlan` для enrollment;
   * - `maxDayNumber` — последний созданный день (`dayNumberInCourse`).
   *
   * Используется сервисом `GetAvailableWeeksService`, чтобы
   * корректно выводить доступные недели и ограничивать дни в UI.
   */
  async getWeeklySummary(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<{
    totalWeeks: number
    activeWeeks: number
    distinctWeeks: number[]
    totalDays: number
    maxDayNumber: number
  }> {
    try {
      const weekAggregate = await db.userDailyPlan.groupBy({
        by: ['weekNumber'],
        where: { enrollmentId },
        orderBy: { weekNumber: 'asc' },
      })

      const distinctWeeks = weekAggregate
        .map(item => item.weekNumber)
        .filter(week => week !== null)

      const totalWeeks = distinctWeeks.length ? Math.max(...distinctWeeks) : 0

      const dayAggregate = await db.userDailyPlan.aggregate({
        where: { enrollmentId },
        _max: {
          dayNumberInCourse: true,
        },
        _count: {
          id: true,
        },
      })

      const maxDayNumber = dayAggregate._max.dayNumberInCourse ?? 0
      const totalDays = dayAggregate._count.id ?? 0

      return {
        totalWeeks,
        activeWeeks: distinctWeeks.length,
        distinctWeeks,
        maxDayNumber,
        totalDays,
      }
    } catch (error) {
      logger.error({
        msg: 'Error getting weekly summary for enrollment',
        enrollmentId,
        error,
      })
      throw new Error('Failed to get weekly summary')
    }
  }

  async updateUserDailyPlans(
    enrollmentId: string,
    selectedWorkoutDays: DayOfWeek[],
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    try {
      const result = await this.planningRepository.updateUserDailyPlans(
        enrollmentId,
        { selectedWorkoutDays },
        db
      )

      logger.info({
        msg: 'Updated user daily plans (in-place, preserve progress)',
        enrollmentId,
        plansCount: result.length,
      })

      return result
    } catch (error) {
      logger.error({
        msg: 'Error updating user daily plans',
        enrollmentId,
        error,
      })
      throw new Error('Failed to update user daily plans')
    }
  }
}
