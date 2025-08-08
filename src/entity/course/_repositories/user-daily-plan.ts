import { dbClient } from '@/shared/lib/db'
import { DayOfWeek, UserDailyPlan as PrismaUserDailyPlan } from '@prisma/client'
import {
  GetUserDailyPlanByEnrollmentParams,
  GetUserDailyPlanParams,
  UserDailyPlan,
} from '../../course'
import { logger } from '@/shared/lib/logger'
import { UserId } from '@/kernel/domain/user'

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
      weekNumber: prismaUserDailyPlan.weekNumber,
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
                orderBy: {
                  dayNumber: 'asc',
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

      // Получаем все дни с основной тренировкой и дни только с зарядкой
      const mainWorkoutDays = course.dailyPlans.filter(dp => dp.mainWorkoutId)
      const warmupOnlyDays = course.dailyPlans.filter(dp => !dp.mainWorkoutId)

      // Проверяем, что у нас достаточно дней для 4-недельного курса
      if (mainWorkoutDays.length < 20) {
        console.log('mainWorkoutDays', course.title)
        // 5 дней * 4 недели = 20 дней с основной тренировкой
        throw new Error(`1 ${course.title} Not enough main workout days for a 4-week course`)
      }
      if (warmupOnlyDays.length < 8) {
        // 2 дня * 4 недели = 8 дней только с зарядкой
        throw new Error(`${course.title}Not enough warmup-only days for a 4-week course`)
      }

      // Создаем календарь на 28 дней (4 недели)
      const startDateObj = new Date(startDate)
      const calendar: Array<{
        date: Date
        dayOfWeek: DayOfWeek
        dayNumberInCourse: number
        weekNumber: number
        isWorkoutDay: boolean
      }> = []

      for (let i = 0; i < 28; i++) {
        const currentDate = new Date(startDateObj)
        currentDate.setDate(startDateObj.getDate() + i)
        const dayOfWeek = this.getDayOfWeek(currentDate)
        const isWorkoutDay = selectedWorkoutDays.includes(dayOfWeek)
        const weekNumber = Math.floor(i / 7) + 1

        calendar.push({
          date: currentDate,
          dayOfWeek,
          dayNumberInCourse: i + 1,
          weekNumber,
          isWorkoutDay,
        })
      }

      // Распределяем дни с основной тренировкой по тренировочным дням
      let mainWorkoutIndex = 0
      let warmupOnlyIndex = 0

      for (const day of calendar) {
        let dailyPlan

        if (day.isWorkoutDay && mainWorkoutIndex < mainWorkoutDays.length) {
          // Если это тренировочный день, берем день с основной тренировкой
          dailyPlan = mainWorkoutDays[mainWorkoutIndex++]
        } else if (warmupOnlyIndex < warmupOnlyDays.length) {
          // Если это не тренировочный день, берем день только с зарядкой
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        } else {
          // Если закончились дни только с зарядкой, используем первый день только с зарядкой
          // (цикличность для дней только с зарядкой)
          warmupOnlyIndex = 0
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        }

        const userDailyPlan = await dbClient.userDailyPlan.create({
          data: {
            userId: enrollment.userId,
            enrollmentId: enrollment.id,
            date: day.date,
            dayNumberInCourse: day.dayNumberInCourse,
            weekNumber: day.weekNumber,
            dayOfWeek: day.dayOfWeek,
            isWorkoutDay: day.isWorkoutDay,
            warmupId: dailyPlan.warmupId,
            mainWorkoutId: day.isWorkoutDay ? dailyPlan.mainWorkoutId : null,
            mealPlanId: dailyPlan.mealPlanId,
            warmupProgress: 'NOT_STARTED',
            mainWorkoutProgress: 'NOT_STARTED',
            mealPlanProgress: 'NOT_STARTED',
            originalDailyPlanId: dailyPlan.id,
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
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      })
      // Пробрасываем оригинальную ошибку вместо создания новой
      throw error instanceof Error ? error : new Error('Failed to generate user daily plans')
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
          enrollmentId_dayNumberInCourse: {
            enrollmentId: enrollment.id,
            dayNumberInCourse: params.dayNumberInCourse,
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
          dayNumberInCourse: params.dayNumberInCourse,
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
    userId: UserId,
    courseId: string,
    selectedWorkoutDays: DayOfWeek[]
  ): Promise<void> {
    try {
      const enrollment = await dbClient.userCourseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
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
          userId,
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
        userId,
        selectedWorkoutDays,
        updatedPlansCount: futurePlans.length,
      })
    } catch (error) {
      logger.error({
        msg: 'Error updating future workout days',
        userId,
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

  async updateWorkoutDays(
    enrollmentId: string,
    selectedWorkoutDays: DayOfWeek[]
  ): Promise<UserDailyPlan[]> {
    try {
      // Получаем текущую дату
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Получаем enrollment
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

      // Обновляем выбранные дни тренировок в enrollment
      await dbClient.userCourseEnrollment.update({
        where: { id: enrollmentId },
        data: { selectedWorkoutDays },
      })

      // Получаем все будущие планы пользователя, начиная с сегодняшнего дня
      const userDailyPlans = await dbClient.userDailyPlan.findMany({
        where: {
          enrollmentId,
          date: { gte: today },
        },
        orderBy: { dayNumberInCourse: 'asc' },
      })

      // Получаем все дни с основной тренировкой и дни только с зарядкой
      const mainWorkoutDays = enrollment.course.dailyPlans.filter(
        dp => dp.mainWorkoutId
      )
      const warmupOnlyDays = enrollment.course.dailyPlans.filter(
        dp => !dp.mainWorkoutId
      )

      // Индексы для отслеживания использованных дней
      let mainWorkoutIndex = 0
      let warmupOnlyIndex = 0

      // Обновляем каждый план
      const updatedPlans: UserDailyPlan[] = []

      for (const plan of userDailyPlans) {
        const planDate = new Date(plan.date)
        const dayOfWeek = this.getDayOfWeek(planDate)
        const isWorkoutDay = selectedWorkoutDays.includes(dayOfWeek)

        let dailyPlan

        if (isWorkoutDay && mainWorkoutIndex < mainWorkoutDays.length) {
          dailyPlan = mainWorkoutDays[mainWorkoutIndex++]
        } else if (warmupOnlyIndex < warmupOnlyDays.length) {
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        } else {
          warmupOnlyIndex = 0
          dailyPlan = warmupOnlyDays[warmupOnlyIndex++]
        }

        const updatedPlan = await dbClient.userDailyPlan.update({
          where: { id: plan.id },
          data: {
            isWorkoutDay,
            warmupId: dailyPlan.warmupId,
            mainWorkoutId: isWorkoutDay ? dailyPlan.mainWorkoutId : null,
            mealPlanId: dailyPlan.mealPlanId,
            originalDailyPlanId: dailyPlan.id,
          },
        })

        updatedPlans.push(this.mapPrismaUserDailyPlanToDomain(updatedPlan))
      }

      return updatedPlans
    } catch (error) {
      logger.error({
        msg: 'Error updating workout days',
        enrollmentId,
        error,
      })
      throw new Error('Failed to update workout days')
    }
  }
}
