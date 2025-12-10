import { ContainerModule } from 'inversify'
import { KnowledgeRepository } from './_repositories/knowledge'
import { GetKnowledgeListService } from './_services/get-knowledge-list'
import { CreateKnowledgeCategoryService } from './_services/create-knowledge-category'
import { UpdateKnowledgeCategoryService } from './_services/update-knowledge-category'
import { DeleteKnowledgeCategoryService } from './_services/delete-knowledge-category'
import { CreateKnowledgeArticleService } from './_services/create-knowledge-article'
import { UpdateKnowledgeArticleService } from './_services/update-knowledge-article'
import { DeleteKnowledgeArticleService } from './_services/delete-knowledge-article'

export const KnowledgeModule = new ContainerModule(context => {
  const { bind } = context
  bind(KnowledgeRepository).toSelf()
  bind(GetKnowledgeListService).toSelf()
  bind(CreateKnowledgeCategoryService).toSelf()
  bind(UpdateKnowledgeCategoryService).toSelf()
  bind(DeleteKnowledgeCategoryService).toSelf()
  bind(CreateKnowledgeArticleService).toSelf()
  bind(UpdateKnowledgeArticleService).toSelf()
  bind(DeleteKnowledgeArticleService).toSelf()
})
