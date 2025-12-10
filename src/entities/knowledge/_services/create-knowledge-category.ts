import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'
import { TRPCError } from '@trpc/server'

@injectable()
export class CreateKnowledgeCategoryService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(input: {
    title: string
    description?: string
    slug: string
    courseId: string
    order?: number
  }) {
    const existing = await this.knowledgeRepository.findCategoryBySlug(
      input.courseId,
      input.slug
    )

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Категория с таким slug уже существует в этом курсе',
      })
    }

    return this.knowledgeRepository.createCategory({
      ...input,
      order: input.order ?? 0,
    })
  }
}
