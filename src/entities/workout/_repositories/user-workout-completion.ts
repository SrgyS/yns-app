import { injectable, inject } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import type { DbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { WorkoutType } from '@prisma/client'
import { WorkoutRepository } from './workout'


export interface UserWorkoutCompletion {
  id: string
  userId: string
  workoutId: string
  enrollmentId: string
  completedAt: Date
  workoutType: WorkoutType
  userDailyPlanId: string
  originalDailyPlanId: string
}

@injectable()
export class UserWorkoutCompletionRepository {
  constructor(
    @inject(WorkoutRepository) private readonly workoutRepository: WorkoutRepository,
    private readonly defaultDb: DbClient = dbClient
  ) {}
  async markWorkoutAsCompleted(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    workoutType: WorkoutType,
    userDailyPlanId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserWorkoutCompletion> {
    try {
      // Получаем originalDailyPlanId из UserDailyPlan только при создании
      const userDailyPlan = await db.userDailyPlan.findUnique({
        where: { id: userDailyPlanId },
        select: { originalDailyPlanId: true }
      });
      
      if (!userDailyPlan) {
        throw new Error('User daily plan not found');
      }
      
      // Используем upsert для создания или обновления записи
      const completion = await db.userWorkoutCompletion.upsert({
        where: {
          userId_workoutId_enrollmentId_workoutType_userDailyPlanId: {
            userId,
            workoutId,
            enrollmentId,
            workoutType,
            userDailyPlanId,
          },
        },
        update: {
          completedAt: new Date(), // Обновляем дату выполнения
        },
        create: {
          userId,
          workoutId,
          enrollmentId,
          workoutType,
          userDailyPlanId,
          completedAt: new Date(),
          originalDailyPlanId: userDailyPlan.originalDailyPlanId
        },
      })

      return {
        id: completion.id,
        userId: completion.userId,
        workoutId: completion.workoutId,
        enrollmentId: completion.enrollmentId,
        completedAt: completion.completedAt,
        workoutType: completion.workoutType,
        userDailyPlanId: completion.userDailyPlanId,
        originalDailyPlanId: completion.originalDailyPlanId
      }
    } catch (error) {
      logger.error({
        msg: 'Error marking workout as completed',
        userId,
        workoutId,
        enrollmentId,
        userDailyPlanId,
        workoutType,
        error,
      })
      throw new Error('Failed to mark workout as completed')
    }
  }

  async removeWorkoutCompletion(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    workoutType: WorkoutType,
    userDailyPlanId: string,
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      // Проверяем существование записи
      const completion = await db.userWorkoutCompletion.findUnique({
        where: {
          userId_workoutId_enrollmentId_workoutType_userDailyPlanId: {
            userId,
            workoutId,
            enrollmentId,
            workoutType,
            userDailyPlanId,
          },
        },
      })

      // Если запись существует, удаляем её
      if (completion) {
        await dbClient.userWorkoutCompletion.delete({
          where: {
            userId_workoutId_enrollmentId_workoutType_userDailyPlanId: {
              userId,
              workoutId,
              enrollmentId,
              workoutType,
              userDailyPlanId,
            },
          },
        })
      }
      // Если записи нет, просто выходим без ошибки
    } catch (error) {
      logger.error({
        msg: 'Error removing workout completion',
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
        error,
      })
      throw new Error('Failed to remove workout completion')
    }
  }

  async getWorkoutCompletionStatus(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    workoutType: WorkoutType,
    userDailyPlanId: string,
    db: DbClient = this.defaultDb
  ): Promise<boolean> {
    try {
      const completion = await db.userWorkoutCompletion.findUnique({
        where: {
          userId_workoutId_enrollmentId_workoutType_userDailyPlanId: {
            userId,
            workoutId,
            enrollmentId,
            workoutType,
            userDailyPlanId,
          },
        },
      })

      return !!completion
    } catch (error) {
      logger.error({
        msg: 'Error getting workout completion status',
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        userDailyPlanId,
        error,
      })
      throw new Error('Failed to get workout completion status')
    }
  }

  // Новый метод для переноса статусов выполнения при изменении расписания
  async transferWorkoutCompletions(
    oldUserDailyPlanId: string,
    newUserDailyPlanId: string,
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      // Получаем все записи о выполнении для старого дня плана
      const completions = await db.userWorkoutCompletion.findMany({
        where: { userDailyPlanId: oldUserDailyPlanId },
      })

      // Создаем новые записи с тем же статусом, но для нового дня плана
      for (const completion of completions) {
        await db.userWorkoutCompletion.create({
          data: {
            userId: completion.userId,
            workoutId: completion.workoutId,
            enrollmentId: completion.enrollmentId,
            workoutType: completion.workoutType,
            userDailyPlanId: newUserDailyPlanId,
            completedAt: completion.completedAt,
            originalDailyPlanId: completion.originalDailyPlanId,
          },
        })
      }
      
      logger.info({
        msg: 'Successfully transferred workout completions',
        oldUserDailyPlanId,
        newUserDailyPlanId,
        originalCount: completions.length,
      })
    } catch (error) {
      logger.error({
        msg: 'Error transferring workout completions',
        oldUserDailyPlanId,
        newUserDailyPlanId,
        error,
      })
      throw new Error('Failed to transfer workout completions')
    }
  }
  async getUserCompletedWorkouts(
    userId: string,
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<UserWorkoutCompletion[]> {
    try {
      const completions = await db.userWorkoutCompletion.findMany({
        where: {
          userId,
          enrollmentId,
        },
      })

      return completions.map(completion => ({
        id: completion.id,
        userId: completion.userId,
        workoutId: completion.workoutId,
        enrollmentId: completion.enrollmentId,
        completedAt: completion.completedAt,
        workoutType: completion.workoutType,
        userDailyPlanId: completion.userDailyPlanId,
        originalDailyPlanId: completion.originalDailyPlanId,
      }))
    } catch (error) {
      logger.error({
        msg: 'Error getting user completed workouts',
        userId,
        enrollmentId,
        error,
      })
      throw new Error('Failed to get user completed workouts')
    }
  }
  
  // Метод для обновления userDailyPlanId в записях о выполнении тренировок после изменения расписания
  async updateCompletionsAfterWorkoutDaysChange(
    userId: string,
    enrollmentId: string,
    newUserDailyPlans: Array<{ id: string; originalDailyPlanId: string; warmupId: string; mainWorkoutId: string | null }>,
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      // Получаем все записи о выполнении для данного пользователя и enrollment
      const existingCompletions = await db.userWorkoutCompletion.findMany({
        where: {
          userId,
          enrollmentId,
        },
      });

      // Создаем хеш-карту для быстрого поиска новых планов по originalDailyPlanId
      const dailyPlanMap = new Map<string, Array<{ 
        planId: string, 
        workoutId: string, 
        workoutType: WorkoutType
      }>>();

      // Кэш для хранения типов тренировок, чтобы не делать повторные запросы
      const workoutTypeCache = new Map<string, WorkoutType>();

      // Заполняем хеш-карту данными из новых планов
      for (const plan of newUserDailyPlans) {
        if (!dailyPlanMap.has(plan.originalDailyPlanId)) {
          dailyPlanMap.set(plan.originalDailyPlanId, []);
        }
        
        // Получаем тип разминки из кэша или из БД
        let warmupType = workoutTypeCache.get(plan.warmupId);
        if (!warmupType) {
          warmupType = await this.workoutRepository.getWorkoutTypeById(plan.warmupId);
          if (warmupType) {
            workoutTypeCache.set(plan.warmupId, warmupType);
          } else {
            logger.warn({
              msg: 'Could not determine workout type for warmup',
              workoutId: plan.warmupId,
              planId: plan.id
            });
            continue;
          }
        }
        
        // Добавляем разминку
        dailyPlanMap.get(plan.originalDailyPlanId)?.push({
          planId: plan.id,
          workoutId: plan.warmupId,
          workoutType: warmupType
        });
        
        // Добавляем основную тренировку, если она есть
        if (plan.mainWorkoutId) {
          // Получаем тип основной тренировки из кэша или из БД
          let mainWorkoutType = workoutTypeCache.get(plan.mainWorkoutId);
          if (!mainWorkoutType) {
            mainWorkoutType = await this.workoutRepository.getWorkoutTypeById(plan.mainWorkoutId);
            if (mainWorkoutType) {
              workoutTypeCache.set(plan.mainWorkoutId, mainWorkoutType);
            } else {
              logger.warn({
                msg: 'Could not determine workout type for main workout',
                workoutId: plan.mainWorkoutId,
                planId: plan.id
              });
              continue;
            }
          }
          
          dailyPlanMap.get(plan.originalDailyPlanId)?.push({
            planId: plan.id,
            workoutId: plan.mainWorkoutId,
            workoutType: mainWorkoutType
          });
        }
      }

      // Массив для хранения промисов обновления
      const updatePromises: Promise<any>[] = [];

      // Обновляем записи о выполнении
      for (const completion of existingCompletions) {
        // Проверяем наличие originalDailyPlanId
        if (!completion.originalDailyPlanId) {
          logger.warn({
            msg: 'Completion record missing originalDailyPlanId',
            completionId: completion.id,
            userDailyPlanId: completion.userDailyPlanId
          });
          continue;
        }

        // Получаем соответствующие планы по originalDailyPlanId
        const matchingPlans = dailyPlanMap.get(completion.originalDailyPlanId) || [];
        
        // Ищем план с совпадающим workoutId и workoutType
        const matchingPlan = matchingPlans.find(plan => 
          plan.workoutId === completion.workoutId && 
          plan.workoutType === completion.workoutType
        );
        
        // Если нашли соответствие, обновляем userDailyPlanId
        if (matchingPlan) {
          updatePromises.push(
            db.userWorkoutCompletion.update({
              where: { id: completion.id },
              data: { userDailyPlanId: matchingPlan.planId }
            }).then(() => {
              logger.info({
                msg: 'Updated workout completion userDailyPlanId',
                completionId: completion.id,
                oldUserDailyPlanId: completion.userDailyPlanId,
                newUserDailyPlanId: matchingPlan.planId,
                workoutId: completion.workoutId,
                workoutType: completion.workoutType,
                originalDailyPlanId: completion.originalDailyPlanId
              });
            })
          );
        }
      }

      // Выполняем все обновления параллельно
      await Promise.all(updatePromises);
      
      logger.info({
        msg: 'Successfully updated workout completions after schedule change',
        userId,
        enrollmentId,
        newPlansCount: newUserDailyPlans.length,
        updatedCompletionsCount: updatePromises.length
      });
    } catch (error) {
      logger.error({
        msg: 'Error updating workout completions after schedule change',
        userId,
        enrollmentId,
        error,
      });
      throw new Error('Failed to update workout completions after schedule change');
    }
  }
}