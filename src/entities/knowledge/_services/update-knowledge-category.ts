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
      courseId?: string // Added courseId to allow updating order in context of a course
    }
  ) {
    if (input.slug) {
      const category = await this.knowledgeRepository.getCategoryById(id)
      if (category) {
        const existing = await this.knowledgeRepository.findCategoryBySlug(
          input.slug
        )

        // Check if existing category found is NOT the one we are updating
        if (existing && existing.id !== id) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Категория с таким slug уже существует',
          })
        }
      }
    }

    const { order, courseId, ...categoryData } = input
    
    // Update global properties
    const updatedCategory = await this.knowledgeRepository.updateCategory(id, categoryData)

    // Update order if provided AND courseId is provided
    if (order !== undefined && courseId) {
        await this.knowledgeRepository.updateCategoryOrder(courseId, id, order)
    }

    return { ...updatedCategory, order: order } // Return combined for UI consistency
  }
}
