import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class CreateKnowledgeArticleService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(input: {
    title: string
    description?: string
    content?: string
    videoId?: string
    attachments?: any
    categoryId: string
    order?: number
  }) {
    return this.knowledgeRepository.createArticle({
      ...input,
      order: input.order ?? 0,
    })
  }
}
