import { dbClient } from '@/shared/lib/db'
import { DayOfWeek, UserDailyPlan as PrismaUserDailyPlan } from '@prisma/client'
import { GetUserDailyPlanByEnrollmentParams, GetUserDailyPlanParams, UserDailyPlan } from '../../course'
import { logger } from '@/shared/lib/logger'

export class UserDailyPlanRepository {
  private mapPrismaUserDailyPlanToDomain(
    prismaUserDailyPlan: PrismaUserDailyPlan
  ): UserDailyPlan {
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
      warmupProgress: prismaUserDailyPlan.warmupProgress,
      mainWorkoutProgress: prismaUserDailyPlan.mainWorkoutProgress,
      mealPlanProgress: prismaUserDailyPlan.mealPlanProgress,
    }
  }

  async generateUserDailyPlansForEnrollment(
    enrollmentId: string
  ): Promise<UserDailyPlan[]> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              dailyPlans: {
                include: {
                  warmup: true,
                  mainWorkout: true,
                  mealPlan: true,
                },
              },
            },
          },
        },
      })
      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      const { course, selectedWorkoutDays, startDate } = enrollment
      const userDailyPlans: UserDailyPlan[] = []

      for (const dailyPlan of course.dailyPlans) {
        const planDate = new Date(startDate)
        planDate.setDate(startDate.getDate() + dailyPlan.dayNumber - 1)

        const dayOfWeek = this.getDayOfWeek(planDate)
        const isWorkoutDay = selectedWorkoutDays.includes(dayOfWeek)
        const userDailyPlan = await dbClient.userDailyPlan.create({
          data: {
            userId: enrollment.userId,
            enrollmentId: enrollment.id,
            date: planDate,
            dayNumberInCourse: dailyPlan.dayNumber,
            isWorkoutDay,
            warmupId: dailyPlan.warmupId,
            mainWorkoutId: dailyPlan.mainWorkoutId,
            mealPlanId: dailyPlan.mealPlanId,
            warmupProgress: 'NOT_STARTED',
            mainWorkoutProgress: 'NOT_STARTED',
            mealPlanProgress: 'NOT_STARTED',
          },
        })
        userDailyPlans.push(this.mapPrismaUserDailyPlanToDomain(userDailyPlan))
      }
      logger.info({
        msg: 'Generated user daily plans for enrollment',
        enrollmentId,
        plansCount: userDailyPlans.length,
      })
      return userDailyPlans
    } catch (error) {
      logger.error({
        msg: 'Error generating user daily plans for enrollment',
        enrollmentId,
        error,
      })
      throw new Error('Failed to generate user daily plans')
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

  async getUserDailyPlan(
    params: GetUserDailyPlanParams
  ): Promise<UserDailyPlan | null> {
    try {
      // Теперь нужно найти enrollment для пользователя и курса
      const enrollment = await dbClient.userCourseEnrollment.findFirst({
        where: {
          userId: params.userId,
          courseId: params.courseId,
        },
      })

      if (!enrollment) {
        return null
      }

      const userDailyPlan = await dbClient.userDailyPlan.findUnique({
        where: {
          enrollmentId_date: {
            enrollmentId: enrollment.id,
            date: params.date,
          },
        },
      })
      return userDailyPlan
        ? this.mapPrismaUserDailyPlanToDomain(userDailyPlan)
        : null
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
    params: GetUserDailyPlanByEnrollmentParams
  ): Promise<UserDailyPlan | null> {
    try {
      const userDailyPlan = await dbClient.userDailyPlan.findFirst({
        where: {
          enrollmentId: params.enrollmentId,
          date: params.date,
        },
      })

      return userDailyPlan
        ? this.mapPrismaUserDailyPlanToDomain(userDailyPlan)
        : null
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
    enrollmentId: string
  ): Promise<UserDailyPlan[]> {
    try {
      const userDailyPlans = await dbClient.userDailyPlan.findMany({
        where: { enrollmentId },
        orderBy: { dayNumberInCourse: 'asc' },
      })

      return userDailyPlans.map(this.mapPrismaUserDailyPlanToDomain.bind(this))
    } catch (error) {
      logger.error({
        msg: 'Error getting user daily plans by enrollment',
        enrollmentId,
        error,
      })
      throw new Error('Failed to get user daily plans')
    }
  }

  async updateFutureWorkoutDays(
    enrollmentId: string,
    selectedWorkoutDays: DayOfWeek[]
  ): Promise<void> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            include: {
              dailyPlans: {
                include: {
                  warmup: true,
                  mainWorkout: true,
                  mealPlan: true,
                },
              },
            },
          },
        },
      })

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0) // Устанавливаем начало дня

      // Получаем все будущие планы для этого enrollment
      const futurePlans = await dbClient.userDailyPlan.findMany({
        where: {
          enrollmentId,
          date: { gte: today },
        },
        orderBy: { date: 'asc' },
      })

      // Обновляем каждый будущий план
      for (const plan of futurePlans) {
        const dayOfWeek = this.getDayOfWeek(plan.date)
        const isWorkoutDay = selectedWorkoutDays.includes(dayOfWeek)

        await dbClient.userDailyPlan.update({
          where: { id: plan.id },
          data: {
            isWorkoutDay,
          },
        })
      }

      logger.info({
        msg: 'Updated future workout days for enrollment',
        enrollmentId,
        selectedWorkoutDays,
        updatedPlansCount: futurePlans.length,
      })
    } catch (error) {
      logger.error({
        msg: 'Error updating future workout days',
        enrollmentId,
        selectedWorkoutDays,
        error,
      })
      throw new Error('Failed to update future workout days')
    }
  }
  // deleteFuturePlans(enrollmentId: string) {
  //   return dbClient.userDailyPlan.deleteMany({
  //     where: {
  //       enrollmentId,
  //       date: { gte: new Date() },
  //     },
  //   })
  // },

  // createMany(data: Prisma.UserDailyPlanCreateManyInput[]) {
  //   return dbClient.userDailyPlan.createMany({ data })
  // },
}
