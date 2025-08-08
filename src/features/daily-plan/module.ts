import { ContainerModule } from 'inversify'
import { Controller } from '@/kernel/lib/trpc/module'
import { WorkoutController } from './_controller'

export const DailyPlanModule = new ContainerModule(context => {
  const { bind } = context
  bind(Controller).to(WorkoutController)
})

export { WorkoutController }