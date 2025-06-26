import { coursesRepository } from '../_repositories/course'

export class GetCoursesListUseCase {
  async exec() {
    return coursesRepository.getCoursesList()
  }
}

export const createUserUseCase = new GetCoursesListUseCase()
