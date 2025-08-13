import { ContainerModule } from 'inversify'
import { WorkoutRepository } from './_repositories/workout'
import { GetWorkoutService } from './_services/get-workout'
import { UserWorkoutCompletionRepository } from './_repositories/user-workout-completion'
import { GetWorkoutCompletionStatusService } from './_services/get-workout-completion-status'
import { UpdateWorkoutCompletionService } from './_services/update-workout-completion'

export const WorkoutEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(WorkoutRepository).toSelf()
  bind(GetWorkoutService).toSelf()
  bind(UserWorkoutCompletionRepository).toSelf()
  bind(GetWorkoutCompletionStatusService).toSelf()
  bind(UpdateWorkoutCompletionService).toSelf()
})

export { GetWorkoutService, GetWorkoutCompletionStatusService, UpdateWorkoutCompletionService }
