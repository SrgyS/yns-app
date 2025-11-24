import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { WorkoutController } from './_controller'
import { GetUserDailyPlanService } from './_services/get-user-daily-plan'
import { DayPlanLoadService } from './_services/day-plan-load'

export const DailyPlanModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetUserDailyPlanService).toSelf()
  bind(DayPlanLoadService).toSelf()
  bind(Controller).to(WorkoutController)
})

export { WorkoutController, DayPlanLoadService }
