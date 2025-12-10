import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class ReorderCourseKnowledgeCategoriesService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async exec(input: {
    courseId: string
    items: Array<{ categoryId: string; order: number }>
  }) {
    return this.knowledgeRepository.reorderCategoriesForCourse(
      input.courseId,
      input.items
    )
  }
}
