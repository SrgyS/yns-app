import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'
import { TRPCError } from '@trpc/server'

@injectable()
export class UpdateKnowledgeCategoryService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(
    id: string,
    input: {
      title?: string
      description?: string
      slug?: string
      order?: number
    }
  ) {
    if (input.slug) {
      const category = await this.knowledgeRepository.getCategoryById(id)
      if (category) {
        const existing = await this.knowledgeRepository.findCategoryBySlug(
          category.courseId,
          input.slug
        )

        // Check if existing category found is NOT the one we are updating
        if (existing && existing.id !== id) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Категория с таким slug уже существует в этом курсе',
          })
        }
      }
    }

    return this.knowledgeRepository.updateCategory(id, input)
  }
}
