import { injectable } from 'inversify'
import { coursesRepository } from '../_repositories/course'

@injectable()
export class GetCoursesListService {
  async exec() {
    return coursesRepository.getCoursesList()
  }
}
