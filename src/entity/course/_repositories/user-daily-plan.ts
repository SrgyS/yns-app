import {
  DayOfWeek,
  Prisma,
  UserDailyPlan as PrismaUserDailyPlan,
  DailyPlan as PrismaDailyPlan,
  Course as PrismaCourse,
  UserCourseEnrollment as PrismaUserCourseEnrollment,
} from '@prisma/client'
import { dbClient, isPrismaClient } from '@/shared/lib/db'
import type { DbClient } from '@/shared/lib/db'
import {
  GetUserDailyPlanByEnrollmentParams,
  GetUserDailyPlanParams,
  UserDailyPlan,
} from '../../course'
import { logger } from '@/shared/lib/logger'

type EnrollmentWithCourse = PrismaUserCourseEnrollment & {
  course: PrismaCourse & { dailyPlans: PrismaDailyPlan[] }
}

export class UserDailyPlanRepository {
  constructor(private readonly defaultDb: DbClient = dbClient) {}
  private toDomain(prismaUserDailyPlan: PrismaUserDailyPlan): UserDailyPlan {
    return {
      id: prismaUserDailyPlan.id,
      userId: prismaUserDailyPlan.userId,
      enrollmentId: prismaUserDailyPlan.enrollmentId,
      date: prismaUserDailyPlan.date,
      dayNumberInCourse: prismaUserDailyPlan.dayNumberInCourse,
      isWorkoutDay: prismaUserDailyPlan.isWorkoutDay,
      warmupId: prismaUserDailyPlan.warmupId,
      mainWorkoutId: prismaUserDailyPlan.mainWorkoutId,
      mealPlanId: prismaUserDailyPlan.mealPlanId,
      weekNumber: prismaUserDailyPlan.weekNumber,
      originalDailyPlanId: prismaUserDailyPlan.originalDailyPlanId,
    }
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ]
    return days[date.getDay()] as DayOfWeek
  }

  private async generatePlansCore(
    enrollmentId: string,
    options: { scope: 'full' } | { scope: 'week'; weekNumber: number },
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    const exec = async (
      tx: Prisma.TransactionClient
    ): Promise<UserDailyPlan[]> => {
      const enrollment = (await tx.userCourseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              dailyPlans: {
                orderBy: [{ weekNumber: 'asc' }, { dayNumberInWeek: 'asc' }],
              },
            },
          },
        },
      })) as EnrollmentWithCourse | null

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      const { course, selectedWorkoutDays, startDate } = enrollment

      const mainWorkoutDays = course.dailyPlans.filter(
        (dp: PrismaDailyPlan) => dp.mainWorkoutId !== null
      )
      const warmupOnlyDays = course.dailyPlans.filter(
        (dp: PrismaDailyPlan) => dp.mainWorkoutId === null
      )

      const requiredMainWorkoutDays =
        course.minWorkoutDaysPerWeek * course.durationWeeks
      const requiredWarmupOnlyDays =
        course.durationWeeks * 7 - requiredMainWorkoutDays

      if (mainWorkoutDays.length < requiredMainWorkoutDays) {
        throw new Error(
          `Not enough main workout days for a ${course.durationWeeks}-week course`
        )
      }
      if (warmupOnlyDays.length < requiredWarmupOnlyDays) {
        throw new Error(
          `Not enough warmup-only days for a ${course.durationWeeks}-week course`
        )
      }

      if (options.scope === 'week') {
        await tx.userDailyPlan.deleteMany({
          where: { enrollmentId, weekNumber: options.weekNumber },
        })
      }

      const startDateObj = new Date(startDate)
      const totalDays = course.durationWeeks * 7
      const rangeStart =
        options.scope === 'week' ? (options.weekNumber - 1) * 7 : 0
      const rangeEnd = options.scope === 'week' ? rangeStart + 7 : totalDays

      let mainWorkoutIndex = 0
      let warmupOnlyIndex = 0

      const created: UserDailyPlan[] = []

      for (let i = rangeStart; i < rangeEnd; i++) {
        const currentDate = new Date(startDateObj)
        currentDate.setDate(startDateObj.getDate() + i)
        const dayOfWeek = this.getDayOfWeek(currentDate)
        const isWorkoutDay = selectedWorkoutDays.includes(dayOfWeek)
        const weekNumber = Math.floor(i / 7) + 1

        let dailyPlan: PrismaDailyPlan

        if (isWorkoutDay && mainWorkoutIndex < mainWorkoutDays.length) {
          dailyPlan = mainWorkoutDays[mainWorkoutIndex++]
        } else if (warmupOnlyIndex < warmupOnlyDays.length) {
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        } else {
          warmupOnlyIndex = 0
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        }

        const createdPlan = await tx.userDailyPlan.create({
          data: {
            userId: enrollment.userId,
            enrollmentId: enrollment.id,
            date: currentDate,
            dayNumberInCourse: i + 1,
            weekNumber,
            dayOfWeek,
            isWorkoutDay,
            warmupId: dailyPlan.warmupId,
            mainWorkoutId: isWorkoutDay ? dailyPlan.mainWorkoutId : null,
            mealPlanId: dailyPlan.mealPlanId ?? null,
            originalDailyPlanId: dailyPlan.id,
          },
        })
        created.push(this.toDomain(createdPlan))
      }

      return created
    }

    if (isPrismaClient(db)) {
      return db.$transaction(async tx => exec(tx))
    }
    // уже внутри внешней транзакции
    return exec(db as Prisma.TransactionClient)
  }

  async generateUserDailyPlansForEnrollment(
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    try {
      const plans = await this.generatePlansCore(
        enrollmentId,
        { scope: 'full' },
        db
      )
      logger.info({
        msg: 'Generated user daily plans for enrollment',
        enrollmentId,
        plansCount: plans.length,
      })
      return plans
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
      const plans = await this.generatePlansCore(
        enrollmentId,
        { scope: 'week', weekNumber },
        db
      )
      logger.info({
        msg: 'Generated user daily plans for week',
        enrollmentId,
        weekNumber,
        plansCount: plans.length,
      })
      return plans
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

  async getUserDailyPlan(
    params: GetUserDailyPlanParams,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan | null> {
    try {
      // Теперь нужно найти enrollment для пользователя и курса
      const enrollment = await db.userCourseEnrollment.findFirst({
        where: {
          userId: params.userId,
          courseId: params.courseId,
        },
      })

      if (!enrollment) {
        return null
      }

      const userDailyPlan = await db.userDailyPlan.findUnique({
        where: {
          enrollmentId_dayNumberInCourse: {
            enrollmentId: enrollment.id,
            dayNumberInCourse: params.dayNumberInCourse,
          },
        },
      })
      return userDailyPlan ? this.toDomain(userDailyPlan) : null
    } catch (error) {
      logger.error({
        msg: 'Error getting user daily plan',
        params,
        error,
      })
      throw new Error('Failed to get user daily plan')
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

  async updateUserDailyPlans(
    enrollmentId: string,
    selectedWorkoutDays: DayOfWeek[],
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    const exec = async (
      tx: Prisma.TransactionClient
    ): Promise<UserDailyPlan[]> => {
      // Получаем enrollment с курсом и планами
      const enrollment = (await tx.userCourseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              dailyPlans: {
                orderBy: [{ weekNumber: 'asc' }, { dayNumberInWeek: 'asc' }],
              },
            },
          },
        },
      })) as EnrollmentWithCourse | null

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      const { course } = enrollment

      const mainWorkoutDays = course.dailyPlans.filter(
        (dp: PrismaDailyPlan) => dp.mainWorkoutId !== null
      )
      const warmupOnlyDays = course.dailyPlans.filter(
        (dp: PrismaDailyPlan) => dp.mainWorkoutId === null
      )

      const requiredMainWorkoutDays =
        course.minWorkoutDaysPerWeek * course.durationWeeks
      const requiredWarmupOnlyDays =
        course.durationWeeks * 7 - requiredMainWorkoutDays

      if (mainWorkoutDays.length < requiredMainWorkoutDays) {
        throw new Error(
          `Not enough main workout days for a ${course.durationWeeks}-week course`
        )
      }
      if (warmupOnlyDays.length < requiredWarmupOnlyDays) {
        throw new Error(
          `Not enough warmup-only days for a ${course.durationWeeks}-week course`
        )
      }

      const updated: UserDailyPlan[] = []
      let mainWorkoutIndex = 0
      let warmupOnlyIndex = 0

      const startDateObj = new Date(enrollment.startDate)
      const totalDays = course.durationWeeks * 7

      for (let i = 0; i < totalDays; i++) {
        const dayNumberInCourse = i + 1
        const currentDate = new Date(startDateObj)
        currentDate.setDate(startDateObj.getDate() + i)
        const dayOfWeek = this.getDayOfWeek(currentDate)
        const isWorkoutDay = selectedWorkoutDays.includes(dayOfWeek)
        const weekNumber = Math.floor(i / 7) + 1

        let dailyPlan: PrismaDailyPlan

        if (isWorkoutDay && mainWorkoutIndex < mainWorkoutDays.length) {
          dailyPlan = mainWorkoutDays[mainWorkoutIndex++]
        } else if (warmupOnlyIndex < warmupOnlyDays.length) {
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        } else {
          warmupOnlyIndex = 0
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        }

        const record = await tx.userDailyPlan.upsert({
          where: {
            enrollmentId_dayNumberInCourse: {
              enrollmentId,
              dayNumberInCourse,
            },
          },
          update: {
            // Обновляем поля на месте, чтобы сохранить id и внешние связи (прогресс)
            isWorkoutDay,
            dayOfWeek,
            weekNumber,
            warmupId: dailyPlan.warmupId,
            mainWorkoutId: isWorkoutDay ? dailyPlan.mainWorkoutId : null,
            mealPlanId: dailyPlan.mealPlanId ?? null,
            originalDailyPlanId: dailyPlan.id,
          },
          create: {
            userId: enrollment.userId,
            enrollmentId: enrollment.id,
            date: currentDate,
            dayNumberInCourse,
            weekNumber,
            dayOfWeek,
            isWorkoutDay,
            warmupId: dailyPlan.warmupId,
            mainWorkoutId: isWorkoutDay ? dailyPlan.mainWorkoutId : null,
            mealPlanId: dailyPlan.mealPlanId ?? null,
            originalDailyPlanId: dailyPlan.id,
          },
        })

        updated.push(this.toDomain(record))
      }

      return updated
    }

    try {
      const plans = isPrismaClient(db)
        ? await db.$transaction(tx => exec(tx))
        : await exec(db as Prisma.TransactionClient)

      logger.info({
        msg: 'Updated user daily plans (in-place, preserve progress)',
        enrollmentId,
        plansCount: plans.length,
      })

      return plans
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
