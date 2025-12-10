import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class UpdateKnowledgeArticleService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(
    id: string,
    input: {
      title?: string
      description?: string
      content?: string
      videoId?: string
      attachments?: any
      order?: number
    }
  ) {
    return this.knowledgeRepository.updateArticle(id, input)
  }
}
