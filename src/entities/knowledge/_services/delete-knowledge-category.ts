import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class DeleteKnowledgeCategoryService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(id: string) {
    return this.knowledgeRepository.deleteCategory(id)
  }
}
