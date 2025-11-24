import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { injectable } from 'inversify'
import { z } from 'zod'
import { GetWorkoutService } from '@/entities/workout/module'
import { UpdateWorkoutCompletionService } from '@/entities/workout/_services/update-workout-completion'
import { DailyContentType, WorkoutType } from '@prisma/client'
import { GetWorkoutCompletionStatusService } from '@/entities/workout/_services/get-workout-completion-status'
import { GetUserDailyPlanService } from './_services/get-user-daily-plan'
import { logger } from '@/shared/lib/logger'
import { ToggleFavoriteWorkoutService } from '@/entities/workout/_services/toggle-favorite-workout'
import { ListFavoriteWorkoutsService } from '@/entities/workout/_services/list-favorite-workouts'
import { ListWorkoutsByIdsService } from '@/entities/workout/_services/list-workouts-by-ids'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'
import { TRPCError } from '@trpc/server'

const LOG_PREFIX = '[WorkoutController]'

async function logTiming<T>(
  label: string,
  action: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    return await action()
  } finally {
    const duration = Date.now() - start
    logger.info({
      msg: `${LOG_PREFIX} ${label}`,
      durationMs: duration,
    })
  }
}

@injectable()
export class WorkoutController extends Controller {
  constructor(
    private getWorkoutService: GetWorkoutService,
    private updateWorkoutCompletionService: UpdateWorkoutCompletionService,
    private getWorkoutCompletionStatusService: GetWorkoutCompletionStatusService,
    private getUserDailyPlanService: GetUserDailyPlanService,
    private toggleFavoriteWorkoutService: ToggleFavoriteWorkoutService,
    private listFavoriteWorkoutsService: ListFavoriteWorkoutsService,
    private getAccessibleEnrollmentsService: GetAccessibleEnrollmentsService,
    private listWorkoutsByIdsService: ListWorkoutsByIdsService
  ) {
    super()
  }

  private async assertHasActiveAccess(userId: string) {
    const enrollments = await this.getAccessibleEnrollmentsService.exec(userId)
    if (enrollments.length === 0) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Нет действующего доступа',
      })
    }
  }

  public router = router({
    getUserDailyPlan: authorizedProcedure
      .input(
        z.object({
          userId: z.string(),
          enrollmentId: z.string(),
          courseId: z.string(),
          dayNumberInCourse: z.number(),
        })
      )
      .query(async ({ input }) => {
        const plan = await logTiming('getUserDailyPlanService.exec', () =>
          this.getUserDailyPlanService.exec({
            userId: input.userId,
            enrollmentId: input.enrollmentId,
            courseId: input.courseId,
            dayNumberInCourse: input.dayNumberInCourse,
          })
        )
        return plan
      }),
    getWorkout: authorizedProcedure
      .input(
        z.object({
          workoutId: z.string(),
        })
      )
      .query(async ({ input }) => {
        const workout = await this.getWorkoutService.getById(input.workoutId)
        return workout
      }),

    updateWorkoutCompletion: authorizedProcedure
      .input(
        z.object({
          userId: z.string(),
          workoutId: z.string(),
          enrollmentId: z.string(),
          workoutType: z.nativeEnum(WorkoutType),
          isCompleted: z.boolean(),
          contentType: z.nativeEnum(DailyContentType),
          stepIndex: z.number().int().nonnegative(),
        })
      )
      .mutation(async ({ input }) => {
        await this.updateWorkoutCompletionService.exec(input)
        return { success: true }
      }),

    getWorkoutCompletionStatus: authorizedProcedure
      .input(
        z.object({
          userId: z.string(),
          enrollmentId: z.string(),
          contentType: z.nativeEnum(DailyContentType),
          stepIndex: z.number().int().nonnegative(),
        })
      )
      .query(async ({ input }) => {
        const isCompleted = await this.getWorkoutCompletionStatusService.exec(
          input.userId,
          input.enrollmentId,
          input.contentType,
          input.stepIndex
        )
        return isCompleted
      }),
    getFavoriteWorkouts: authorizedProcedure.query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      await this.assertHasActiveAccess(userId)
      const favorites = await this.listFavoriteWorkoutsService.exec(userId)
      return favorites.map(favorite => favorite.workoutId)
    }),
    toggleFavoriteWorkout: authorizedProcedure
      .input(
        z.object({
          workoutId: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id
        await this.assertHasActiveAccess(userId)
        const result = await this.toggleFavoriteWorkoutService.exec({
          userId,
          workoutId: input.workoutId,
        })
        return {
          isFavorite: result.isFavorite,
          workoutId: input.workoutId,
        }
      }),
    getFavoriteWorkoutDetails: authorizedProcedure.query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      await this.assertHasActiveAccess(userId)
      const favorites = await this.listFavoriteWorkoutsService.exec(userId)

      if (favorites.length === 0) {
        return []
      }

      const workoutIds = favorites.map(favorite => favorite.workoutId)
      const workouts = await this.listWorkoutsByIdsService.exec(workoutIds)
      return workouts
    }),
  })
}
