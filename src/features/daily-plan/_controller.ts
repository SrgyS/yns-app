import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { injectable } from 'inversify'
import { z } from 'zod'
import { GetWorkoutService } from '@/entity/workout/module'

@injectable()
export class WorkoutController extends Controller {
  constructor(private getWorkoutService: GetWorkoutService) {
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
  })
}