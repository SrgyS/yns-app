import { coursesRepository } from '../_repositories/course'

export class GetCoursesListService {
  async exec() {
    return coursesRepository.getCoursesList()
  }
}

export const createUserService = new GetCoursesListService()
