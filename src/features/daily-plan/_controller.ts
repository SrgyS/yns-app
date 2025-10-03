import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { injectable } from 'inversify'
import { z } from 'zod'
import { GetWorkoutService } from '@/entities/workout/module'
import { UpdateWorkoutCompletionService } from '@/entities/workout/_services/update-workout-completion'
import { WorkoutType } from '@prisma/client'
import { GetWorkoutCompletionStatusService } from '@/entities/workout/_services/get-workout-completion-status'

@injectable()
export class WorkoutController extends Controller {
  constructor(
    private getWorkoutService: GetWorkoutService,
    private updateWorkoutCompletionService: UpdateWorkoutCompletionService,
    private getWorkoutCompletionStatusService: GetWorkoutCompletionStatusService
  ) {
    super()
  }

  public router = router({
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
          userDailyPlanId: z.string(),
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
          workoutId: z.string(),
          enrollmentId: z.string(),
          workoutType: z.nativeEnum(WorkoutType),
          userDailyPlanId: z.string(),
        })
      )
      .query(async ({ input }) => {
        const isCompleted = await this.getWorkoutCompletionStatusService.exec(
          input.userId,
          input.workoutId,
          input.enrollmentId,
          input.workoutType,
          input.userDailyPlanId
        )
        return isCompleted
      }),
  })
}