import { injectable } from 'inversify'
import { CoursesRepository } from '../_repositories/course'

@injectable()
export class GetCoursesListService {
  constructor(private coursesRepository: CoursesRepository) {}
  async exec() {
    return this.coursesRepository.getCoursesList()
  }
}
