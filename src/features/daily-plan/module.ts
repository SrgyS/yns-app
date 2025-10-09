import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { WorkoutController } from './_controller'
import { GetUserDailyPlanService } from './_services/get-user-daily-plan'

export const DailyPlanModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetUserDailyPlanService).toSelf()
  bind(Controller).to(WorkoutController)
})

export { WorkoutController }
