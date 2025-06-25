import { cache } from 'react'
import { CourseEntity } from '../_domain/types'
import { fetchManifest } from '@/shared/api/content'

class CoursesRepository {
  getCoursesList = cache(async (): Promise<CourseEntity[]> => {
    const manifest = await fetchManifest()
    console.log('manifest', manifest)
    return [
      {
        id: '1',
        name: 'Course 1',
        description: 'Description 1',
        slug: 'course-1',
      },
    ]
  })
}

export const coursesRepository = new CoursesRepository()
