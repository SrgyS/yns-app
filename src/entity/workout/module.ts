import { ContainerModule } from 'inversify'
import { WorkoutRepository } from './_repositories/workout'
import { GetWorkoutService } from './_services/get-workout'

export const WorkoutEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(WorkoutRepository).toSelf()
  bind(GetWorkoutService).toSelf()
})

export { GetWorkoutService }
