import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class LinkKnowledgeCategoryService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(input: {
    courseId: string
    categoryId: string
    order?: number
  }) {
    return this.knowledgeRepository.linkCategory(
      input.courseId,
      input.categoryId,
      input.order
    )
  }
}
