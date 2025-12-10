import { ContainerModule } from 'inversify'
import { KnowledgeRepository } from './_repositories/knowledge'
import { GetKnowledgeListService } from './_services/get-knowledge-list'
import { CreateKnowledgeCategoryService } from './_services/create-knowledge-category'
import { UpdateKnowledgeCategoryService } from './_services/update-knowledge-category'
import { DeleteKnowledgeCategoryService } from './_services/delete-knowledge-category'
import { CreateKnowledgeArticleService } from './_services/create-knowledge-article'
import { UpdateKnowledgeArticleService } from './_services/update-knowledge-article'
import { DeleteKnowledgeArticleService } from './_services/delete-knowledge-article'
import { LinkKnowledgeCategoryService } from './_services/link-knowledge-category-to-course'
import { UnlinkKnowledgeCategoryService } from './_services/unlink-knowledge-category-from-course'
import { ReorderCourseKnowledgeCategoriesService } from './_services/reorder-course-knowledge-categories'
import { ReorderKnowledgeArticlesService } from './_services/reorder-knowledge-articles'

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
  bind(LinkKnowledgeCategoryService).toSelf()
  bind(UnlinkKnowledgeCategoryService).toSelf()
  bind(ReorderCourseKnowledgeCategoriesService).toSelf()
  bind(ReorderKnowledgeArticlesService).toSelf()
})
