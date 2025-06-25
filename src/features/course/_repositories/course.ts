import { cache } from 'react'
import { CourseEntity } from '../_domain/types'
import { contentApi } from '@/shared/api/content'

class CoursesRepository {
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

    const setteledCourses = await Promise.allSettled(manifest.courses.map(fetchCourse))

    setteledCourses.forEach(value => {
      if (value.status === 'rejected') {
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
