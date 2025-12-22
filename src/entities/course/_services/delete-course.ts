import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { injectable } from 'inversify'
import { AuthorizatoinError, NotFoundError } from '@/shared/lib/errors'

import { CoursesRepository } from '../_repositories/course'

type DeleteCourseCommand = {
  id: string
}

type DeleteCourseAbility = {
  canManageCourses: boolean
}

@injectable()
export class DeleteCourseService {
  constructor(private readonly coursesRepository: CoursesRepository) {}

  async exec(command: DeleteCourseCommand, ability: DeleteCourseAbility) {
    if (!ability?.canManageCourses) {
      throw new AuthorizatoinError('Недостаточно прав для удаления курса')
    }

    try {
      await this.coursesRepository.deleteById(command.id)
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundError('Курс не найден или уже удален')
      }
      throw error
    }
  }
}
