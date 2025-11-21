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
  UserDailyPlanCreateData,
} from '../_services/plan-generation'
import { startOfWeek } from 'date-fns'

type EnrollmentWithCourse = PrismaUserCourseEnrollment & {
  course: PrismaCourse & { dailyPlans: PrismaDailyPlan[] }
}

export interface GenerateUserDailyPlansOptions {
  scope: 'full' | { week: number }
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
      mainWorkoutId: prismaUserDailyPlan.mainWorkoutId,
      mealPlanId: prismaUserDailyPlan.mealPlanId,
      weekNumber: prismaUserDailyPlan.weekNumber,
      originalDailyPlanId: prismaUserDailyPlan.originalDailyPlanId,
      warmupStepIndex: prismaUserDailyPlan.warmupStepIndex,
      mainWorkoutStepIndex: prismaUserDailyPlan.mainWorkoutStepIndex,
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
    options: GenerateUserDailyPlansOptions = { scope: 'full' },
    db: DbClient = this.defaultDb
  ): Promise<UserDailyPlan[]> {
    const exec = async (
      tx: Prisma.TransactionClient
    ): Promise<UserDailyPlan[]> => {
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
            dailyPlans: course.dailyPlans,
          }
        )

      // Вычисление диапазона генерации
      const range = this.generationService.calculateGenerationRange(
        options.scope,
        context
      )

      // Удаление существующих планов для указанного диапазона
      if (options.scope !== 'full' && 'week' in options.scope) {
        await tx.userDailyPlan.deleteMany({
          where: { enrollmentId, weekNumber: options.scope.week },
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
        const createdPlan = await tx.userDailyPlan.create({
          data: planData,
        })
        created.push(this.toDomain(createdPlan))
      }

      return created
    }

    if (isPrismaClient(db)) {
      return db.$transaction(async tx => exec(tx))
    }
    return exec(db as Prisma.TransactionClient)
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
    const exec = async (
      tx: Prisma.TransactionClient
    ): Promise<UserDailyPlan[]> => {
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
            dailyPlans: course.dailyPlans,
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
        const dayNumberInCourse = i + 1

        // Создание данных для создания плана (если план не существует)
        const createData: UserDailyPlanCreateData = {
          userId: enrollment.userId,
          enrollmentId: enrollment.id,
          date: this.dateService.calculateDateForDay(effectiveStartDate, i),
          dayNumberInCourse,
          weekNumber: this.dateService.calculateWeekNumber(
            i,
            effectiveStartDate
          ),
          dayOfWeek: this.dateService.getDayOfWeek(
            this.dateService.calculateDateForDay(effectiveStartDate, i)
          ),
          isWorkoutDay: updateData.isWorkoutDay,
          warmupId: updateData.warmupId,
          mainWorkoutId: updateData.mainWorkoutId,
          mealPlanId: updateData.mealPlanId,
          originalDailyPlanId: updateData.originalDailyPlanId,
          warmupStepIndex: updateData.warmupStepIndex,
          mainWorkoutStepIndex: updateData.mainWorkoutStepIndex,
        }

        const record = await tx.userDailyPlan.upsert({
          where: {
            enrollmentId_dayNumberInCourse: {
              enrollmentId,
              dayNumberInCourse,
            },
          },
          update: updateData,
          create: createData,
        })

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
    return exec(db as Prisma.TransactionClient)
  }
}
