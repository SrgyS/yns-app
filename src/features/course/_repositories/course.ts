import { cache } from 'react'
import { injectable } from 'inversify'
import { CourseEntity } from '../_domain/types'
import { contentApi } from '@/shared/api/content'
import { logger } from '@/shared/lib/logger'

@injectable()
export class CoursesRepository {
  getCoursesList = cache(async (): Promise<CourseEntity[]> => {
    const manifest = await contentApi.fetchManifest()

    const fetchCourse = async (courseSlug: string): Promise<CourseEntity> => {
      const course = await contentApi.fetchCourse(courseSlug)
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        slug: courseSlug,
      }
    }

    const setteledCourses = await Promise.allSettled(
      manifest.courses.map(fetchCourse)
    )

    setteledCourses.forEach((value, i) => {
      if (value.status === 'rejected') {
        logger.error({
          msg: 'Course by slug not found',
          slug: manifest.courses[i],
          error: value.reason,
        })
      }
    })

    return setteledCourses
      .filter(
        (courseResult): courseResult is PromiseFulfilledResult<CourseEntity> =>
          courseResult.status === 'fulfilled'
      )
      .map(course => {
        return course.value
      })
  })
}

export const coursesRepository = new CoursesRepository()
