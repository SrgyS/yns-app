import { injectable } from 'inversify'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { GetUserCoursesListService } from '@/features/user-courses/module'
import { KnowledgeRepository } from '@/entities/knowledge/_repositories/knowledge'

type KnowledgeCategoryWithArticles = Awaited<
  ReturnType<KnowledgeRepository['getCategoriesWithArticles']>
>[number]

export type UserKnowledgeResult = {
  courseId: string | null
  courseTitle: string | null
  categories: KnowledgeCategoryWithArticles[]
  courses: Array<{ id: string; title: string }>
}

@injectable()
export class GetUserKnowledgeService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly userCoursesService: GetUserCoursesListService,
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async exec(courseId?: string): Promise<UserKnowledgeResult> {
    const session = await this.sessionService.get()
    if (!session?.user?.id) {
      return { courseId: null, courseTitle: null, categories: [], courses: [] }
    }

    const courses = await this.userCoursesService.exec(session.user.id)
    if (courses.length === 0) {
      return { courseId: null, courseTitle: null, categories: [], courses: [] }
    }

    const requested = courseId
      ? courses.find(item => item.course.id === courseId)
      : undefined
    const target = requested ?? courses[0]

    const categories = await this.knowledgeRepository.getCategoriesWithArticles(
      target.course.id
    )

    return {
      courseId: target.course.id,
      courseTitle: target.course.title,
      categories,
      courses: courses.map(item => ({
        id: item.course.id,
        title: item.course.title,
      })),
    }
  }

  async getCategory(courseId: string | undefined, categoryId: string) {
    const session = await this.sessionService.get()
    if (!session?.user?.id) {
      return null
    }

    const courses = await this.userCoursesService.exec(session.user.id)

    const findInCourse = async (targetCourseId: string) => {
      const categories =
        await this.knowledgeRepository.getCategoriesWithArticles(targetCourseId)
      return categories.find(item => item.id === categoryId)
    }

    // 1) если передан courseId и есть доступ к нему — ищем там
    if (courseId && courses.some(item => item.course.id === courseId)) {
      const category = await findInCourse(courseId)
      if (category) {
        return {
          courseId,
          courseTitle:
            courses.find(item => item.course.id === courseId)?.course.title ??
            null,
          category,
        }
      }
    }

    // 2) иначе ищем по всем доступным курсам, где найдётся категория
    for (const item of courses) {
      const category = await findInCourse(item.course.id)
      if (category) {
        return {
          courseId: item.course.id,
          courseTitle: item.course.title,
          category,
        }
      }
    }

    return null
  }
}
