import { ContainerModule } from 'inversify'
import { GetUserKnowledgeService } from './_services/get-user-knowledge'

export const UserKnowledgeModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetUserKnowledgeService).toSelf()
})

export { GetUserKnowledgeService } from './_services/get-user-knowledge'
