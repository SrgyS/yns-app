import { ContainerModule } from 'inversify'
import { WorkoutRepository } from './_repositories/workout'
import { GetWorkoutService } from './_services/get-workout'
import { UserWorkoutCompletionRepository } from './_repositories/user-workout-completion'
import { GetWorkoutCompletionStatusService } from './_services/get-workout-completion-status'
import { UpdateWorkoutCompletionService } from './_services/update-workout-completion'
import { ListWorkoutsService } from './_services/list-workouts'
import { WorkoutCatalogController } from './_controller'
import { Controller } from '@/kernel/lib/trpc/module'
import { UserFavoriteWorkoutRepository } from './_repositories/user-favorite-workout'
import { ToggleFavoriteWorkoutService } from './_services/toggle-favorite-workout'
import { ListFavoriteWorkoutsService } from './_services/list-favorite-workouts'
import { ListWorkoutsByIdsService } from './_services/list-workouts-by-ids'

export const WorkoutEntityModule = new ContainerModule(context => {
  const { bind } = context
  bind(WorkoutRepository).toSelf()
  bind(GetWorkoutService).toSelf()
  bind(ListWorkoutsService).toSelf()
  bind(UserWorkoutCompletionRepository).toSelf()
  bind(GetWorkoutCompletionStatusService).toSelf()
  bind(UpdateWorkoutCompletionService).toSelf()
  bind(UserFavoriteWorkoutRepository).toSelf()
  bind(ToggleFavoriteWorkoutService).toSelf()
  bind(ListFavoriteWorkoutsService).toSelf()
  bind(ListWorkoutsByIdsService).toSelf()
  bind(Controller).to(WorkoutCatalogController)
})

export { GetWorkoutService } from './_services/get-workout'
export { ListWorkoutsService } from './_services/list-workouts'
export { GetWorkoutCompletionStatusService } from './_services/get-workout-completion-status'
export { UpdateWorkoutCompletionService } from './_services/update-workout-completion'
export { ToggleFavoriteWorkoutService } from './_services/toggle-favorite-workout'
export { ListFavoriteWorkoutsService } from './_services/list-favorite-workouts'
export { ListWorkoutsByIdsService } from './_services/list-workouts-by-ids'
