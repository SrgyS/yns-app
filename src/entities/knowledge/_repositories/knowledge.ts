import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'

@injectable()
export class KnowledgeRepository {
  // --- Categories ---

  async getAllCategories() {
    return dbClient.knowledgeCategory.findMany({
      orderBy: { title: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    })
  }

  async getAllCategoriesWithCourseLink(courseId: string) {
    const categories = await dbClient.knowledgeCategory.findMany({
      orderBy: { title: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
        courses: {
          where: { courseId },
          select: {
            courseId: true,
            order: true,
          },
        },
      },
    })

    return categories.map(({ courses, ...category }) => ({
      ...category,
      linked: courses.length > 0,
      order: courses[0]?.order ?? null,
    }))
  }

  async getCategoriesByCourse(courseId: string) {
    const links = await dbClient.courseKnowledgeCategory.findMany({
      where: { courseId },
      include: {
        category: {
          include: {
            _count: {
              select: { articles: true },
            },
            articles: false,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return links.map(link => ({
      ...link.category,
      order: link.order,
    }))
  }

  async getCategoriesWithArticles(courseId: string) {
    const links = await dbClient.courseKnowledgeCategory.findMany({
      where: { courseId },
      include: {
        category: {
          include: {
            articles: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return links.map(link => ({
      ...link.category,
      order: link.order,
      articles: link.category.articles,
    }))
  }

  async getCategoryById(id: string) {
    return dbClient.knowledgeCategory.findUnique({
      where: { id },
    })
  }

  async findCategoryBySlug(slug: string) {
    return dbClient.knowledgeCategory.findUnique({
      where: {
        slug,
      },
    })
  }

  async createCategory(data: {
    title: string
    description?: string
    slug: string
    courseId?: string
    order?: number
  }) {
    if (data.courseId) {
      return dbClient.$transaction(async tx => {
        const category = await tx.knowledgeCategory.create({
          data: {
            title: data.title,
            description: data.description,
            slug: data.slug,
          },
        })

        await tx.courseKnowledgeCategory.create({
          data: {
            courseId: data.courseId!,
            categoryId: category.id,
            order: data.order ?? 0,
          },
        })

        return { ...category, order: data.order ?? 0 }
      })
    } else {
      return dbClient.knowledgeCategory.create({
        data: {
          title: data.title,
          description: data.description,
          slug: data.slug,
        },
      })
    }
  }

  async updateCategory(
    id: string,
    data: {
      title?: string
      description?: string
      slug?: string
    }
  ) {
    return dbClient.knowledgeCategory.update({
      where: { id },
      data,
    })
  }

  async updateCategoryOrder(courseId: string, categoryId: string, order: number) {
    return dbClient.courseKnowledgeCategory.update({
      where: {
        courseId_categoryId: {
          courseId,
          categoryId,
        },
      },
      data: { order },
    })
  }

  async deleteCategory(id: string) {
    return dbClient.knowledgeCategory.delete({
      where: { id },
    })
  }

  async linkCategory(courseId: string, categoryId: string, order: number = 0) {
    return dbClient.courseKnowledgeCategory.create({
      data: {
        courseId,
        categoryId,
        order,
      },
    })
  }

  async reorderCategoriesForCourse(
    courseId: string,
    items: Array<{ categoryId: string; order: number }>
  ) {
    return dbClient.$transaction(
      items.map(item =>
        dbClient.courseKnowledgeCategory.update({
          where: {
            courseId_categoryId: {
              courseId,
              categoryId: item.categoryId,
            },
          },
          data: { order: item.order },
        })
      )
    )
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
    order?: number
  }) {
    const nextOrder = await (async () => {
      if (typeof data.order === 'number') {
        return data.order
      }

      const last = await dbClient.knowledgeArticle.findFirst({
        where: { categoryId: data.categoryId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      return (last?.order ?? -1) + 1
    })()

    return dbClient.knowledgeArticle.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        videoId: data.videoId,
        attachments: data.attachments,
        categoryId: data.categoryId,
        order: nextOrder,
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

  async reorderArticles(
    categoryId: string,
    items: Array<{ articleId: string; order: number }>
  ) {
    return dbClient.$transaction(
      items.map(item =>
        dbClient.knowledgeArticle.update({
          where: { id: item.articleId },
          data: { order: item.order },
        })
      )
    )
  }
}
