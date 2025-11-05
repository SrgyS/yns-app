import { injectable } from 'inversify'
import type { CourseAccessInfo } from '@/entities/course'
import { CoursesRepository } from '../_repositories/course'
import { CourseId } from '@/kernel/domain/course'

@injectable()
export class GetCoursesForAccessCheckService {
  constructor(private readonly coursesRepository: CoursesRepository) {}

  async exec(courseIds: CourseId[]): Promise<CourseAccessInfo[]> {
    return this.coursesRepository.getCoursesForAccessCheck(courseIds)
  }
}
