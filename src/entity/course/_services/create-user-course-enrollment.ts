import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { CreateUserCourseEnrollmentParams, UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'
import { dbClient } from '@/shared/lib/db'
import { DayOfWeek } from '@prisma/client'

@injectable()
export class CreateUserCourseEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async exec(
    params: CreateUserCourseEnrollmentParams
  ): Promise<UserCourseEnrollment> {
    try {
      const existingEnrollments =
        await this.userCourseEnrollmentRepository.getUserEnrollments(
          params.userId
        )

      let selectedWorkoutDays = params.selectedWorkoutDays

      if (existingEnrollments.length > 0) {
        const existingWorkoutDays = existingEnrollments[0].selectedWorkoutDays
        if (existingWorkoutDays.length > 0) {
          selectedWorkoutDays = existingWorkoutDays
        }

        // Деактивируем все предыдущие записи пользователя на курсы
        await this.userCourseEnrollmentRepository.deactivateUserEnrollments(
          params.userId
        )
      }

      // Используем транзакцию для атомарного создания enrollment и userDailyPlan
      return await dbClient.$transaction(async tx => {
        // Создаем enrollment внутри транзакции
        const enrollment = await tx.userCourseEnrollment.create({
          data: {
            userId: params.userId,
            courseId: params.courseId,
            startDate: params.startDate,
            selectedWorkoutDays: selectedWorkoutDays,
            hasFeedback: params.hasFeedback ?? false,
            active: true,
          },
        })

        // Получаем данные курса для генерации планов
        const course = await tx.course.findUnique({
          where: { id: params.courseId },
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
        })

        if (!course) {
          throw new Error('Course not found')
        }

        // Получаем все дни с основной тренировкой и дни только с зарядкой
        const mainWorkoutDays = course.dailyPlans.filter(dp => dp.mainWorkoutId)
        const warmupOnlyDays = course.dailyPlans.filter(dp => !dp.mainWorkoutId)

        // Вычисляем необходимое количество дней с тренировками на основе параметров курса
        const requiredMainWorkoutDays = course.minWorkoutDaysPerWeek * course.durationWeeks
        const requiredWarmupOnlyDays = (7 - course.minWorkoutDaysPerWeek) * course.durationWeeks

        // Проверяем, что у нас достаточно дней для курса
        if (mainWorkoutDays.length < requiredMainWorkoutDays) {
          throw new Error(`Not enough main workout days for a ${course.durationWeeks}-week course with ${course.minWorkoutDaysPerWeek} workout days per week`)
        }
        if (warmupOnlyDays.length < requiredWarmupOnlyDays) {
          throw new Error(`Not enough warmup-only days for a ${course.durationWeeks}-week course with ${course.minWorkoutDaysPerWeek} workout days per week`)
        }

        // Проверяем, что у нас достаточно дней для 4-недельного курса
        if (mainWorkoutDays.length < 20) {
          // 5 дней * 4 недели = 20 дней с основной тренировкой
          throw new Error('Not enough main workout days for a 4-week course')
        }
        if (warmupOnlyDays.length < 8) {
          // 2 дня * 4 недели = 8 дней только с зарядкой
          throw new Error('Not enough warmup-only days for a 4-week course')
        }

        // Создаем календарь на 28 дней (4 недели)
        const startDateObj = new Date(params.startDate)
        const calendar: Array<{
          date: Date
          dayOfWeek: DayOfWeek
          dayNumberInCourse: number
          weekNumber: number
          isWorkoutDay: boolean
        }> = []

        // Функция для получения дня недели
        const getDayOfWeek = (date: Date): DayOfWeek => {
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

        for (let i = 0; i < 28; i++) {
          const currentDate = new Date(startDateObj)
          currentDate.setDate(startDateObj.getDate() + i)
          const dayOfWeek = getDayOfWeek(currentDate)
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
        const userDailyPlans = []

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

          // Создаем userDailyPlan внутри транзакции
          const userDailyPlan = await tx.userDailyPlan.create({
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
          userDailyPlans.push(userDailyPlan)
        }

        logger.info({
          msg: 'Generated user daily plans for enrollment',
          enrollmentId: enrollment.id,
          plansCount: userDailyPlans.length,
        })

        // Возвращаем enrollment в доменном формате
        return {
          id: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          selectedWorkoutDays: enrollment.selectedWorkoutDays,
          startDate: enrollment.startDate,
          hasFeedback: enrollment.hasFeedback,
          active: enrollment.active,
        }
      })
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
}
