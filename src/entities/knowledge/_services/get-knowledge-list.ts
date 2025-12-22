import { injectable } from 'inversify'
import { KnowledgeRepository } from '../_repositories/knowledge'

@injectable()
export class GetKnowledgeListService {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async getCategories(courseId: string) {
    return this.knowledgeRepository.getCategoriesByCourse(courseId)
  }

  async getGlobalCategories() {
    return this.knowledgeRepository.getAllCategories()
  }

  async getCategoriesWithCourseLink(courseId: string) {
    return this.knowledgeRepository.getAllCategoriesWithCourseLink(courseId)
  }

  async getArticles(categoryId: string) {
    return this.knowledgeRepository.getArticlesByCategory(categoryId)
  }
}
