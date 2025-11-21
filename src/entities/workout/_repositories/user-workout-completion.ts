import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import type { DbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { DailyContentType, WorkoutType } from '@prisma/client'
import type { UserDailyPlan } from '@/entities/course'

export interface UserWorkoutCompletion {
  id: string
  userId: string
  workoutId: string
  enrollmentId: string
  completedAt: Date
  workoutType: WorkoutType
  contentType: DailyContentType
  stepIndex: number
}

@injectable()
export class UserWorkoutCompletionRepository {
  constructor(private readonly defaultDb: DbClient = dbClient) {}

  async markWorkoutAsCompleted(
    userId: string,
    workoutId: string,
    enrollmentId: string,
    workoutType: WorkoutType,
    contentType: DailyContentType,
    stepIndex: number,
    db: DbClient = this.defaultDb
  ): Promise<UserWorkoutCompletion> {
    try {
      const completion = await db.userWorkoutCompletion.upsert({
        where: {
          userId_enrollmentId_contentType_stepIndex: {
            userId,
            enrollmentId,
            contentType,
            stepIndex,
          },
        },
        update: {
          workoutId,
          workoutType,
          completedAt: new Date(),
        },
        create: {
          userId,
          workoutId,
          enrollmentId,
          workoutType,
          contentType,
          stepIndex,
          completedAt: new Date(),
        },
      })

      return {
        id: completion.id,
        userId: completion.userId,
        workoutId: completion.workoutId,
        enrollmentId: completion.enrollmentId,
        completedAt: completion.completedAt,
        workoutType: completion.workoutType,
        contentType: completion.contentType,
        stepIndex: completion.stepIndex,
      }
    } catch (error) {
      logger.error({
        msg: 'Error marking workout as completed',
        userId,
        workoutId,
        enrollmentId,
        workoutType,
        contentType,
        stepIndex,
        error,
      })
      throw new Error('Failed to mark workout as completed')
    }
  }

  async removeWorkoutCompletion(
    userId: string,
    enrollmentId: string,
    contentType: DailyContentType,
    stepIndex: number,
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      await db.userWorkoutCompletion.deleteMany({
        where: {
          userId,
          enrollmentId,
          contentType,
          stepIndex,
        },
      })
    } catch (error) {
      logger.error({
        msg: 'Error removing workout completion',
        userId,
        enrollmentId,
        contentType,
        stepIndex,
        error,
      })
      throw new Error('Failed to remove workout completion')
    }
  }

  async getWorkoutCompletionStatus(
    userId: string,
    enrollmentId: string,
    contentType: DailyContentType,
    stepIndex: number,
    db: DbClient = this.defaultDb
  ): Promise<boolean> {
    try {
      const completion = await db.userWorkoutCompletion.findUnique({
        where: {
          userId_enrollmentId_contentType_stepIndex: {
            userId,
            enrollmentId,
            contentType,
            stepIndex,
          },
        },
      })

      return !!completion
    } catch (error) {
      logger.error({
        msg: 'Error getting workout completion status',
        userId,
        enrollmentId,
        contentType,
        stepIndex,
        error,
      })
      throw new Error('Failed to get workout completion status')
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
        contentType: completion.contentType,
        stepIndex: completion.stepIndex,
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

  async deleteAllForEnrollment(
    userId: string,
    enrollmentId: string,
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      await db.userWorkoutCompletion.deleteMany({
        where: { userId, enrollmentId },
      })
    } catch (error) {
      logger.error({
        msg: 'Error deleting workout completions for enrollment',
        userId,
        enrollmentId,
        error,
      })
      throw new Error('Failed to delete workout completions for enrollment')
    }
  }

  async realignCompletionsAfterScheduleChange(
    userId: string,
    enrollmentId: string,
    previousPlans: UserDailyPlan[],
    updatedPlans: UserDailyPlan[],
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      const completions = await db.userWorkoutCompletion.findMany({
        where: {
          userId,
          enrollmentId,
        },
        orderBy: {
          contentType: 'asc',
        },
      })

      if (completions.length === 0) {
        return
      }

      const buildSequence = (plans: UserDailyPlan[]) => {
        const sortedPlans = [...plans].sort(
          (a, b) => a.dayNumberInCourse - b.dayNumberInCourse
        )
        const warmupCounters = new Map<string, number>()
        const mainCounters = new Map<string, number>()
        const byKey = new Map<
          string,
          { workoutId: string; occurrence: number }
        >()
        const byOccurrence = new Map<string, number>()

        for (const plan of sortedPlans) {
          // Warmup entry
          const warmupOccurrence = (warmupCounters.get(plan.warmupId) ?? 0) + 1
          warmupCounters.set(plan.warmupId, warmupOccurrence)
          const warmupKey = `${DailyContentType.WARMUP}:${plan.warmupStepIndex}`
          byKey.set(warmupKey, {
            workoutId: plan.warmupId,
            occurrence: warmupOccurrence,
          })
          const warmupOccurrenceKey = `${DailyContentType.WARMUP}:${plan.warmupId}:${warmupOccurrence}`
          byOccurrence.set(warmupOccurrenceKey, plan.warmupStepIndex)

          if (plan.mainWorkoutId) {
            const mainOccurrence =
              (mainCounters.get(plan.mainWorkoutId) ?? 0) + 1
            mainCounters.set(plan.mainWorkoutId, mainOccurrence)
            const mainKey = `${DailyContentType.MAIN}:${plan.mainWorkoutStepIndex ?? 0}`
            byKey.set(mainKey, {
              workoutId: plan.mainWorkoutId,
              occurrence: mainOccurrence,
            })
            const mainOccurrenceKey = `${DailyContentType.MAIN}:${plan.mainWorkoutId}:${mainOccurrence}`
            byOccurrence.set(mainOccurrenceKey, plan.mainWorkoutStepIndex ?? 0)
          }
        }

        return { byKey, byOccurrence }
      }

      const previousMap = buildSequence(previousPlans)
      const updatedMap = buildSequence(updatedPlans)

      for (const completion of completions) {
        const completionKey = `${completion.contentType}:${completion.stepIndex}`
        const occurrenceInfo = previousMap.byKey.get(completionKey)

        if (!occurrenceInfo) {
          // Если соответствия нет, удаляем прогресс, чтобы избежать неверной привязки
          await db.userWorkoutCompletion.delete({
            where: { id: completion.id },
          })
          continue
        }

        const occurrenceKey = `${completion.contentType}:${occurrenceInfo.workoutId}:${occurrenceInfo.occurrence}`
        const newStepIndex = updatedMap.byOccurrence.get(occurrenceKey)

        if (!newStepIndex || newStepIndex === completion.stepIndex) {
          continue
        }

        await db.userWorkoutCompletion.deleteMany({
          where: {
            userId,
            enrollmentId,
            contentType: completion.contentType,
            stepIndex: newStepIndex,
          },
        })

        await db.userWorkoutCompletion.updateMany({
          where: { id: completion.id },
          data: { stepIndex: newStepIndex },
        })
      }
    } catch (error) {
      logger.error({
        msg: 'Error realigning workout completions after schedule change',
        userId,
        enrollmentId,
        error,
      })
      throw new Error(
        'Failed to realign workout completions after schedule change'
      )
    }
  }
}
