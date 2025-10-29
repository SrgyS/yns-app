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

const LOG_PREFIX = '[WorkoutController]'

async function logTiming<T>(label: string, action: () => Promise<T>): Promise<T> {
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
    private getUserDailyPlanService: GetUserDailyPlanService
  ) {
    super()
  }

  public router = router({
    getUserDailyPlan: authorizedProcedure
      .input(
        z.object({
          userId: z.string(),
          courseId: z.string(),
          dayNumberInCourse: z.number(),
        })
      )
      .query(async ({ input }) => {
        const plan = await logTiming('getUserDailyPlanService.exec', () =>
          this.getUserDailyPlanService.exec({
            userId: input.userId,
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
  })
}
