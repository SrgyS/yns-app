import { injectable } from 'inversify'
import { Lesson } from '../_domain/types'
import { contentApi } from '@/shared/api/content'
import { logger } from '@/shared/lib/logger'
import { allSuccess } from '@/shared/lib/promise'
import { CourseSlug, LessonSlug } from '@/kernel/domain/course'
import { isDefined } from '@/shared/api/content/_lib/assert'

@injectable()
export class DailyPlanRepository {
  dailyPlan = async (courseSlug: CourseSlug): Promise<Lesson[]> => {
    const course = await contentApi.fetchCourse(courseSlug)

    const fetchLesson = async (lessonSlug: LessonSlug): Promise<Lesson> => {
      const { blocks, id, title, shortDescription } =
        await contentApi.fetchLesson(courseSlug, lessonSlug)

      return {
        id,
        blocks: blocks
          .map(block => (block.type === 'text' ? block : undefined))
          .filter(isDefined),
        title,
        shortDescription,
        courseId: course.slug ?? '',
        slug: lessonSlug,
      }
    }

    if (!course.dailyPlans) {
      logger.error({
        msg: 'Course dailyPlans is undefined',
        slug: course.slug,
      })
      return []
    }

    return allSuccess(course.dailyPlans.map(fetchLesson), (value, i) => {
      if (value.status === 'rejected') {
        logger.error({
          msg: 'Lesson by slug not found',
          slug: course.dailyPlans?.[i],
          error: value.reason,
        })
      }
    })
  }
}
