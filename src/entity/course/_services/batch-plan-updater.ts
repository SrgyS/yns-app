import { injectable } from 'inversify'
import { PrismaClient, CourseContentType } from '@prisma/client'
import { DbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { PlanningRepository } from '../../planning'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'

/**
 * Сервис для батчевого обновления планов пользователей при добавлении новых недель.
 * Оптимизирован для работы с большим количеством пользователей (1000+).
 */
@injectable()
export class BatchPlanUpdaterService {
  private static readonly BATCH_SIZE = 100 // Размер батча для обработки пользователей
  private static readonly CONCURRENT_BATCHES = 5 // Количество одновременно обрабатываемых батчей
  private static readonly RETRY_ATTEMPTS = 3 // Количество попыток при ошибке
  private static readonly RETRY_DELAY_MS = 1000 // Задержка между попытками

  constructor(
    private planningRepository: PlanningRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  /**
   * Обновляет планы всех пользователей подписочного курса при добавлении новой недели.
   * Использует батчевую обработку для оптимизации производительности.
   */
  async updatePlansForNewWeek(
    courseId: string,
    weekNumber: number,
    db: DbClient
  ): Promise<{
    totalUsers: number
    updatedUsers: number
    failedUsers: number
    errors: Array<{ userId: string; error: string }>
  }> {
    const startTime = Date.now()
    
    logger.info({
      msg: 'Starting batch plan update for new week',
      courseId,
      weekNumber,
    })

    try {
      // Проверяем, что курс является подписочным
      const course = await (db as PrismaClient).course.findUnique({
        where: { id: courseId },
        select: { contentType: true, title: true },
      })

      if (!course) {
        throw new Error(`Course ${courseId} not found`)
      }

      if (course.contentType !== CourseContentType.SUBSCRIPTION) {
        throw new Error(`Course ${courseId} is not a subscription course`)
      }

      // Получаем всех пользователей с активными подписками на курс
      const enrollments = await (db as PrismaClient).userCourseEnrollment.findMany({
        where: {
          courseId,
          // Только активные подписки
          active: true,
        },
        select: {
          id: true,
          userId: true,
          startDate: true,
        },
        orderBy: {
          startDate: 'asc', // Сначала старые подписки
        },
      })

      if (enrollments.length === 0) {
        logger.info({
          msg: 'No active enrollments found for course',
          courseId,
        })
        return {
          totalUsers: 0,
          updatedUsers: 0,
          failedUsers: 0,
          errors: [],
        }
      }

      logger.info({
        msg: 'Found enrollments to process',
        courseId,
        totalEnrollments: enrollments.length,
      })

      // Разбиваем пользователей на батчи
      const batches = this.createBatches(
        enrollments.map(e => ({ id: e.id, userId: e.userId, purchasedAt: e.startDate })),
        BatchPlanUpdaterService.BATCH_SIZE
      )
      const results = {
        totalUsers: enrollments.length,
        updatedUsers: 0,
        failedUsers: 0,
        errors: [] as Array<{ userId: string; error: string }>,
      }

      // Обрабатываем батчи параллельно с ограничением concurrency
      for (let i = 0; i < batches.length; i += BatchPlanUpdaterService.CONCURRENT_BATCHES) {
        const currentBatches = batches.slice(i, i + BatchPlanUpdaterService.CONCURRENT_BATCHES)
        
        const batchPromises = currentBatches.map(async (batch, batchIndex) => {
          const actualBatchIndex = i + batchIndex
          return this.processBatch(batch, actualBatchIndex, courseId, db)
        })

        const batchResults = await Promise.allSettled(batchPromises)
        
        // Собираем результаты
        batchResults.forEach((result, batchIndex) => {
          if (result.status === 'fulfilled') {
            results.updatedUsers += result.value.updatedUsers
            results.failedUsers += result.value.failedUsers
            results.errors.push(...result.value.errors)
          } else {
            const actualBatchIndex = i + batchIndex
            const batch = currentBatches[batchIndex]
            logger.error({
              msg: 'Batch processing failed completely',
              batchIndex: actualBatchIndex,
              batchSize: batch.length,
              error: result.reason,
            })
            
            // Помечаем всех пользователей в батче как неудачных
            results.failedUsers += batch.length
            batch.forEach(enrollment => {
              results.errors.push({
                userId: enrollment.userId,
                error: `Batch processing failed: ${result.reason}`,
              })
            })
          }
        })

        // Логируем прогресс
        const processedBatches = Math.min(i + BatchPlanUpdaterService.CONCURRENT_BATCHES, batches.length)
        logger.info({
          msg: 'Batch processing progress',
          courseId,
          processedBatches,
          totalBatches: batches.length,
          updatedUsers: results.updatedUsers,
          failedUsers: results.failedUsers,
        })
      }

      const duration = Date.now() - startTime
      logger.info({
        msg: 'Batch plan update completed',
        courseId,
        weekNumber,
        duration,
        ...results,
      })

      return results
    } catch (error) {
      logger.error({
        msg: 'Error in batch plan update',
        courseId,
        weekNumber,
        error,
      })
      throw new Error(`Failed to update plans for new week: ${error}`)
    }
  }

  /**
   * Обрабатывает один батч пользователей.
   */
  private async processBatch(
    enrollments: Array<{ id: string; userId: string; purchasedAt: Date }>,
    batchIndex: number,
    courseId: string,
    db: DbClient
  ): Promise<{
    updatedUsers: number
    failedUsers: number
    errors: Array<{ userId: string; error: string }>
  }> {
    const batchResults = {
      updatedUsers: 0,
      failedUsers: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    }

    logger.debug({
      msg: 'Processing batch',
      batchIndex,
      batchSize: enrollments.length,
      courseId,
    })

    // Обрабатываем каждого пользователя в батче
    const userPromises = enrollments.map(enrollment => 
      this.updateUserPlansWithRetry(enrollment, courseId, db)
    )

    const userResults = await Promise.allSettled(userPromises)
    
    userResults.forEach((result, userIndex) => {
      const enrollment = enrollments[userIndex]
      
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          batchResults.updatedUsers++
        } else {
          batchResults.failedUsers++
          batchResults.errors.push({
            userId: enrollment.userId,
            error: result.value.error || 'Unknown error',
          })
        }
      } else {
        batchResults.failedUsers++
        batchResults.errors.push({
          userId: enrollment.userId,
          error: `Promise rejected: ${result.reason}`,
        })
      }
    })

    logger.debug({
      msg: 'Batch processing completed',
      batchIndex,
      ...batchResults,
    })

    return batchResults
  }

  /**
   * Обновляет планы одного пользователя с повторными попытками при ошибке.
   */
  private async updateUserPlansWithRetry(
    enrollment: { id: string; userId: string; purchasedAt: Date },
    courseId: string,
    db: DbClient
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= BatchPlanUpdaterService.RETRY_ATTEMPTS; attempt++) {
      try {
        // Обновляем планы пользователя через новый репозиторий
        await this.userDailyPlanRepository.generateUserDailyPlansForEnrollment(
          enrollment.id,
          db
        )

        return { success: true }
      } catch (error) {
        lastError = error as Error
        
        if (attempt < BatchPlanUpdaterService.RETRY_ATTEMPTS) {
          // Ждем перед следующей попыткой
          await this.delay(BatchPlanUpdaterService.RETRY_DELAY_MS * attempt)
          
          logger.warn({
            msg: 'Retrying user plan update',
            userId: enrollment.userId,
            attempt,
            error: error,
          })
        }
      }
    }

    logger.error({
      msg: 'Failed to update user plans after all retries',
      userId: enrollment.userId,
      attempts: BatchPlanUpdaterService.RETRY_ATTEMPTS,
      error: lastError,
    })

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    }
  }

  /**
   * Разбивает массив на батчи заданного размера.
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * Создает задержку на указанное количество миллисекунд.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Получает статистику по планам пользователей для курса.
   */
  async getUpdateStatistics(
    courseId: string,
    db: DbClient
  ): Promise<{
    totalEnrollments: number
    usersWithPlans: number
    usersNeedingUpdate: number
  }> {
    try {
      const [totalEnrollments, usersWithPlans] = await Promise.all([
        (db as PrismaClient).userCourseEnrollment.count({
          where: {
            courseId,
            active: true,
          },
        }),
        (db as PrismaClient).userDailyPlan.groupBy({
          by: ['userId'],
          where: {
            enrollment: {
              courseId,
              active: true,
            },
          },
        }).then(result => result.length),
      ])

      // Для упрощения считаем, что всем пользователям нужно обновление
      // В реальности можно добавить более сложную логику
      const usersNeedingUpdate = totalEnrollments

      return {
        totalEnrollments,
        usersWithPlans,
        usersNeedingUpdate,
      }
    } catch (error) {
      logger.error({
        msg: 'Error getting update statistics',
        courseId,
        error,
      })
      throw new Error('Failed to get update statistics')
    }
  }
}