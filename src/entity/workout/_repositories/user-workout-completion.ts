import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { WorkoutType } from '@prisma/client'

export interface UserWorkoutCompletion {
  id: string
  userId: string
  workoutId: string
  enrollmentId: string
  completedAt: Date
  workoutType: WorkoutType
  userDailyPlanId: string
}

@injectable()
export class UserWorkoutCompletionRepository {

  async markWorkoutAsCompleted(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    workoutType: WorkoutType,
    userDailyPlanId: string
  ): Promise<UserWorkoutCompletion> {
    try {
      // Используем upsert для создания или обновления записи
      const completion = await dbClient.userWorkoutCompletion.upsert({
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
    userDailyPlanId: string
  ): Promise<void> {
    try {
      // Проверяем существование записи
      const completion = await dbClient.userWorkoutCompletion.findUnique({
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
    userDailyPlanId: string
  ): Promise<boolean> {
    try {
      const completion = await dbClient.userWorkoutCompletion.findUnique({
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
  ): Promise<void> {
    try {
      // Получаем все записи о выполнении для старого дня плана
      const completions = await dbClient.userWorkoutCompletion.findMany({
        where: { userDailyPlanId: oldUserDailyPlanId },
      })

      // Создаем новые записи с тем же статусом, но для нового дня плана
      for (const completion of completions) {
        await dbClient.userWorkoutCompletion.create({
          data: {
            userId: completion.userId,
            workoutId: completion.workoutId,
            enrollmentId: completion.enrollmentId,
            workoutType: completion.workoutType,
            userDailyPlanId: newUserDailyPlanId,
            completedAt: completion.completedAt,
          },
        })
      }
      
      logger.info({
        msg: 'Successfully transferred workout completions',
        oldUserDailyPlanId,
        newUserDailyPlanId,
        transferredCount: completions.length,
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
  ): Promise<UserWorkoutCompletion[]> {
    try {
      const completions = await dbClient.userWorkoutCompletion.findMany({
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
}