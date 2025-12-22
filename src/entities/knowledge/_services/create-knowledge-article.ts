import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'
import { compileMDX } from '@/shared/lib/mdx/server'

@injectable()
export class CreateKnowledgeArticleService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(input: {
    title: string
    description?: string
    content?: string
    videoId?: string
    videoTitle?: string
    videoDurationSec?: number | null
    attachments?: any
    categoryId: string
    order?: number
  }) {
    const compiled = input.content ? await compileMDX(input.content) : null

    return this.knowledgeRepository.createArticle({
      ...input,
      contentMdx: compiled?.code ?? null,
    })
  }
}
