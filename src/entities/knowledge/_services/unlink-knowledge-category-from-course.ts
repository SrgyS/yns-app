import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'

@injectable()
export class UnlinkKnowledgeCategoryService {
  constructor() {}

  async exec(input: {
    courseId: string
    categoryId: string
  }) {
    return dbClient.courseKnowledgeCategory.delete({
      where: {
        courseId_categoryId: {
          courseId: input.courseId,
          categoryId: input.categoryId,
        },
      },
    })
  }
}
