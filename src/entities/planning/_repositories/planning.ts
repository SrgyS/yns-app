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
import { UserDailyPlan } from '../../course'
import { DateCalculationService } from '../_services/date-calculation'
import { PlanValidationService } from '../_services/plan-validation'
import {
  PlanGenerationService,
  GenerationContext,
} from '../_services/plan-generation'
import { startOfWeek } from 'date-fns'

type EnrollmentWithCourse = PrismaUserCourseEnrollment & {
  course: PrismaCourse & {
    dailyPlans: (PrismaDailyPlan & {
      mainWorkouts: { workoutId: string; order: number }[]
    })[]
  }
}

export interface GenerateUserDailyPlansOptions {
  scope: 'full' | { week: number }
}

const DEFAULT_GENERATION_OPTIONS: GenerateUserDailyPlansOptions = {
  scope: 'full',
}

export interface UpdateUserDailyPlansOptions {
  selectedWorkoutDays: DayOfWeek[]
}

/**
 * Репозиторий для управления планированием
 * Объединяет логику генерации, валидации и работы с датами
 */
export class PlanningRepository {
  private readonly dateService: DateCalculationService
  private readonly validationService: PlanValidationService
  private readonly generationService: PlanGenerationService

  constructor(private readonly defaultDb: DbClient = dbClient) {
    this.dateService = new DateCalculationService()
    this.validationService = new PlanValidationService()
    this.generationService = new PlanGenerationService(
      this.dateService,
      this.validationService
    )
  }

  /**
   * Преобразование Prisma модели в доменную модель
   */
  private toDomain(prismaUserDailyPlan: PrismaUserDailyPlan): UserDailyPlan {
    return {
      id: prismaUserDailyPlan.id,
      userId: prismaUserDailyPlan.userId,
      enrollmentId: prismaUserDailyPlan.enrollmentId,
      date: prismaUserDailyPlan.date,
      dayNumberInCourse: prismaUserDailyPlan.dayNumberInCourse,
      isWorkoutDay: prismaUserDailyPlan.isWorkoutDay,
      warmupId: prismaUserDailyPlan.warmupId,
      mainWorkouts: [],
      mealPlanId: prismaUserDailyPlan.mealPlanId,
      weekNumber: prismaUserDailyPlan.weekNumber,
      originalDailyPlanId: prismaUserDailyPlan.originalDailyPlanId,
      warmupStepIndex: prismaUserDailyPlan.warmupStepIndex,
    }
  }

  /**
   * Получение enrollment с курсом и планами
   */
  private async getEnrollmentWithCourse(
    enrollmentId: string,
    tx: Prisma.TransactionClient
  ): Promise<EnrollmentWithCourse> {
    const enrollment = (await tx.userCourseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            dailyPlans: {
              orderBy: [{ weekNumber: 'asc' }, { dayNumberInWeek: 'asc' }],
              include: {
                mainWorkouts: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    })) as EnrollmentWithCourse | null

    if (!enrollment) {
      throw new Error('Enrollment not found')
    }

    return enrollment
  }

  /**
   * Генерация планов пользователя для enrollment
   */
  async generateUserDailyPlans(
    enrollmentId: string,
    {
      scope = 'full',
    }: GenerateUserDailyPlansOptions = DEFAULT_GENERATION_OPTIONS,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    const exec = async (tx: DbClient): Promise<UserDailyPlan[]> => {
      const enrollment = await this.getEnrollmentWithCourse(enrollmentId, tx)
      const { course, selectedWorkoutDays, startDate } = enrollment

      // Для подписки нормализуем старт на понедельник календарной недели покупки
      const effectiveStartDate =
        course.contentType === 'SUBSCRIPTION'
          ? startOfWeek(startDate, { weekStartsOn: 1 })
          : startDate

      // Валидация планов курса
      const validation = this.validationService.validateCoursePlans(
        course,
        course.dailyPlans
      )

      if (!validation.isValid) {
        throw new Error(
          `Course validation failed: ${validation.errors.join(', ')}`
        )
      }

      // Подготовка контекста генерации
      const context: GenerationContext =
        this.generationService.prepareGenerationContext(
          {
            id: enrollment.id,
            userId: enrollment.userId,
            startDate: effectiveStartDate,
            selectedWorkoutDays,
          },
          {
            durationWeeks: course.durationWeeks,
            allowedWorkoutDaysPerWeek:
              course.allowedWorkoutDaysPerWeek &&
              course.allowedWorkoutDaysPerWeek.length > 0
                ? course.allowedWorkoutDaysPerWeek
                : [5],
            dailyPlans: course.dailyPlans.map(dp => ({
              ...dp,
              mainWorkouts: dp.mainWorkouts ?? [],
            })),
          }
        )

      // Вычисление диапазона генерации
      const range = this.generationService.calculateGenerationRange(
        scope,
        context
      )

      // Удаление существующих планов для указанного диапазона
      if (scope !== 'full' && 'week' in scope) {
        await tx.userDailyPlan.deleteMany({
          where: { enrollmentId, weekNumber: scope.week },
        })
      }

      // Генерация данных для создания планов
      const plansData = this.generationService.generatePlansForRange(
        context,
        range
      )

      // Создание планов в базе данных
      const created: UserDailyPlan[] = []
      for (const planData of plansData) {
        const { mainWorkouts } = planData
        const createdPlan = await tx.userDailyPlan.create({
          data: {
            user: { connect: { id: planData.userId } },
            enrollment: { connect: { id: planData.enrollmentId } },
            date: planData.date,
            dayNumberInCourse: planData.dayNumberInCourse,
            weekNumber: planData.weekNumber,
            dayOfWeek: planData.dayOfWeek,
            isWorkoutDay: planData.isWorkoutDay,
            warmup: { connect: { id: planData.warmupId } },
            mealPlan: planData.mealPlanId
              ? { connect: { id: planData.mealPlanId } }
              : undefined,
            originalDailyPlan: {
              connect: { id: planData.originalDailyPlanId },
            },
            warmupStepIndex: planData.warmupStepIndex,
          },
        })
        if (mainWorkouts.length) {
          await tx.userDailyMainWorkout.createMany({
            data: mainWorkouts.map(mw => ({
              userDailyPlanId: createdPlan.id,
              workoutId: mw.workoutId,
              order: mw.order,
              stepIndex: mw.stepIndex,
            })),
          })
        }
        created.push(this.toDomain(createdPlan))
      }

      return created
    }

    if (isPrismaClient(db)) {
      return db.$transaction(async tx => exec(tx))
    }
    return exec(db)
  }

  /**
   * Генерация планов для конкретной недели
   */
  async generateUserDailyPlansForWeek(
    enrollmentId: string,
    weekNumber: number,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    return this.generateUserDailyPlans(
      enrollmentId,
      { scope: { week: weekNumber } },
      db
    )
  }

  /**
   * Обновление планов пользователя с новыми тренировочными днями
   */
  async updateUserDailyPlans(
    enrollmentId: string,
    options: UpdateUserDailyPlansOptions,
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    const exec = async (tx: DbClient): Promise<UserDailyPlan[]> => {
      const enrollment = await this.getEnrollmentWithCourse(enrollmentId, tx)
      const { course, startDate } = enrollment
      const { selectedWorkoutDays } = options

      // Для подписки нормализуем старт на понедельник
      const effectiveStartDate =
        course.contentType === 'SUBSCRIPTION'
          ? startOfWeek(startDate, { weekStartsOn: 1 })
          : startDate

      // Валидация планов курса
      const validation = this.validationService.validateCoursePlans(
        course,
        course.dailyPlans
      )

      if (!validation.isValid) {
        throw new Error(
          `Course validation failed: ${validation.errors.join(', ')}`
        )
      }

      // Подготовка контекста генерации
      const context: GenerationContext =
        this.generationService.prepareGenerationContext(
          {
            id: enrollment.id,
            userId: enrollment.userId,
            startDate: effectiveStartDate,
            selectedWorkoutDays,
          },
          {
            durationWeeks: course.durationWeeks,
            allowedWorkoutDaysPerWeek:
              course.allowedWorkoutDaysPerWeek &&
              course.allowedWorkoutDaysPerWeek.length > 0
                ? course.allowedWorkoutDaysPerWeek
                : [5],
            dailyPlans: course.dailyPlans.map(dp => ({
              ...dp,
              mainWorkouts: dp.mainWorkouts ?? [],
            })),
          }
        )

      // Вычисление диапазона для полного курса
      const range = this.generationService.calculateGenerationRange(
        'full',
        context
      )

      // Генерация данных для обновления
      const updateDataList = this.generationService.generateUpdateDataForRange(
        context,
        range
      )

      // Обновление планов в базе данных
      const updated: UserDailyPlan[] = []
      for (let i = 0; i < updateDataList.length; i++) {
        const updateData = updateDataList[i]
        const { mainWorkouts } = updateData
        const dayNumberInCourse = i + 1

        // Создание данных для создания плана (если план не существует)
        const createData: Prisma.UserDailyPlanCreateInput = {
          user: { connect: { id: enrollment.userId } },
          enrollment: { connect: { id: enrollment.id } },
          date: this.dateService.calculateDateForDay(effectiveStartDate, i),
          dayNumberInCourse,
          weekNumber: this.dateService.calculateWeekNumber(i),
          dayOfWeek: this.dateService.getDayOfWeek(
            this.dateService.calculateDateForDay(effectiveStartDate, i)
          ),
          isWorkoutDay: updateData.isWorkoutDay,
          warmup: { connect: { id: updateData.warmupId } },
          mealPlan: updateData.mealPlanId
            ? { connect: { id: updateData.mealPlanId } }
            : undefined,
          originalDailyPlan: {
            connect: { id: updateData.originalDailyPlanId },
          },
          warmupStepIndex: updateData.warmupStepIndex,
        }

        const record = await tx.userDailyPlan.upsert({
          where: {
            enrollmentId_dayNumberInCourse: {
              enrollmentId,
              dayNumberInCourse,
            },
          },
          update: {
            isWorkoutDay: updateData.isWorkoutDay,
            dayOfWeek: updateData.dayOfWeek,
            weekNumber: updateData.weekNumber,
            warmupId: updateData.warmupId,
            mealPlanId: updateData.mealPlanId,
            originalDailyPlanId: updateData.originalDailyPlanId,
            warmupStepIndex: updateData.warmupStepIndex,
          },
          create: createData,
        })

        await tx.userDailyMainWorkout.deleteMany({
          where: { userDailyPlanId: record.id },
        })
        if (mainWorkouts.length) {
          await tx.userDailyMainWorkout.createMany({
            data: mainWorkouts.map(mw => ({
              userDailyPlanId: record.id,
              workoutId: mw.workoutId,
              order: mw.order,
              stepIndex: mw.stepIndex,
            })),
          })
        }

        updated.push(this.toDomain(record))
      }

      await tx.userDailyPlan.deleteMany({
        where: {
          enrollmentId,
          dayNumberInCourse: { gt: updateDataList.length },
        },
      })

      return updated
    }

    if (isPrismaClient(db)) {
      return db.$transaction(async tx => exec(tx))
    }
    return exec(db)
  }
}
