import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class ReorderKnowledgeArticlesService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(input: {
    categoryId: string
    items: Array<{ articleId: string; order: number }>
  }) {
    return this.knowledgeRepository.reorderArticles(input.categoryId, input.items)
  }
}
