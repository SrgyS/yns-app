import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'
import { compileMDX } from '@/shared/lib/mdx/server'

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
      videoTitle?: string
      videoDurationSec?: number | null
      attachments?: any
      order?: number
    }
  ) {
    const shouldUpdateContent = input.content !== undefined
    const compiled =
      shouldUpdateContent && input.content !== null
        ? await compileMDX(input.content ?? '')
        : null

    return this.knowledgeRepository.updateArticle(id, {
      ...input,
      contentMdx: shouldUpdateContent ? compiled?.code ?? null : undefined,
    })
  }
}
