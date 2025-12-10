import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class DeleteKnowledgeArticleService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(id: string) {
    return this.knowledgeRepository.deleteArticle(id)
  }
}
