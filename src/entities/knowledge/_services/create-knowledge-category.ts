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
    courseId?: string
    order?: number
  }) {
    const existing = await this.knowledgeRepository.findCategoryBySlug(
      input.slug
    )

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        // Note: With decoupling, we might want to allow this if we just link it?
        // But the user asked to "create category ... then add to different courses".
        // If I create a category that exists, should I fail or just link?
        // For now, let's keep failure on "Create New". We'll add a "Link Existing" feature later.
        message: 'Категория с таким slug уже существует',
      })
    }

    return this.knowledgeRepository.createCategory({
      ...input,
      order: input.order,
    })
  }
}
