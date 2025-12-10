import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'

@injectable()
export class KnowledgeRepository {
  // --- Categories ---

  async getCategoriesByCourse(courseId: string) {
    return dbClient.knowledgeCategory.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    })
  }

  async getCategoryById(id: string) {
    return dbClient.knowledgeCategory.findUnique({
      where: { id },
    })
  }

  async findCategoryBySlug(courseId: string, slug: string) {
    return dbClient.knowledgeCategory.findUnique({
      where: {
        courseId_slug: {
          courseId,
          slug,
        },
      },
    })
  }

  async createCategory(data: {
    title: string
    description?: string
    slug: string
    courseId: string
    order: number
  }) {
    return dbClient.knowledgeCategory.create({
      data: {
        title: data.title,
        description: data.description,
        slug: data.slug,
        courseId: data.courseId,
        order: data.order,
      },
    })
  }

  async updateCategory(
    id: string,
    data: {
      title?: string
      description?: string
      slug?: string
      order?: number
    }
  ) {
    return dbClient.knowledgeCategory.update({
      where: { id },
      data,
    })
  }

  async deleteCategory(id: string) {
    return dbClient.knowledgeCategory.delete({
      where: { id },
    })
  }

  // --- Articles ---

  async getArticlesByCategory(categoryId: string) {
    return dbClient.knowledgeArticle.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    })
  }

  async getArticleById(id: string) {
    return dbClient.knowledgeArticle.findUnique({
      where: { id },
      include: { category: true },
    })
  }

  async createArticle(data: {
    title: string
    description?: string
    content?: string
    videoId?: string
    attachments?: any
    categoryId: string
    order: number
  }) {
    return dbClient.knowledgeArticle.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        videoId: data.videoId,
        attachments: data.attachments,
        categoryId: data.categoryId,
        order: data.order,
      },
    })
  }

  async updateArticle(
    id: string,
    data: {
      title?: string
      description?: string
      content?: string
      videoId?: string
      attachments?: any
      order?: number
    }
  ) {
    return dbClient.knowledgeArticle.update({
      where: { id },
      data,
    })
  }

  async deleteArticle(id: string) {
    return dbClient.knowledgeArticle.delete({
      where: { id },
    })
  }
}
