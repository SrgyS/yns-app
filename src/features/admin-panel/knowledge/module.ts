import { ContainerModule } from 'inversify'
import { AdminKnowledgeController } from './_controller'
import { Controller } from '@/kernel/lib/trpc/module'

export const AdminKnowledgeModule = new ContainerModule(context => {
  const { bind } = context
  bind(AdminKnowledgeController).toSelf()
  bind(Controller).toService(AdminKnowledgeController)
})
