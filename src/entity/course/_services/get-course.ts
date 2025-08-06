import { injectable } from 'inversify'
import { CoursesRepository } from '../_repositories/course'
import { CourseId, CourseSlug } from '@/kernel/domain/course'

type Query =
  | {
      id: CourseId
    }
  | { slug: CourseSlug }

@injectable()
export class GetCourseService {
  constructor(private coursesRepository: CoursesRepository) {}
  async exec(query: Query) {
    if ('slug' in query) {
      return this.coursesRepository.courseBySlug(query.slug)
    }

    return this.coursesRepository.courseById(query.id) 
  }
}
