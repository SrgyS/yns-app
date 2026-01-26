import { injectable } from 'inversify'
import { CourseContentType, AccessType } from '@prisma/client'
import { AuthorizatoinError } from '@/shared/lib/errors'

import { CoursesRepository } from '../_repositories/course'

type CreateCourseCommand = {
  title: string
  slug: string
  description: string
  shortDescription?: string
  thumbnail?: string
  image?: string
  contentType: CourseContentType
  access: AccessType
  price?: number
  durationDays: number
  durationWeeks: number
}

type CreateCourseAbility = {
  canManageCourses: boolean
}

@injectable()
export class CreateCourseService {
  constructor(private readonly coursesRepository: CoursesRepository) {}

  async exec(command: CreateCourseCommand, ability: CreateCourseAbility) {
    if (!ability?.canManageCourses) {
      throw new AuthorizatoinError('Недостаточно прав для создания курса')
    }

    if (command.access !== AccessType.paid) {
      throw new AuthorizatoinError('Бесплатные тарифы не поддерживаются')
    }

    const {
      title,
      slug,
      description,
      shortDescription,
      thumbnail,
      image,
      contentType,
      price,
      durationWeeks,
      durationDays,
    } = command

    return this.coursesRepository.create({
      title,
      slug,
      description,
      shortDescription,
      thumbnail: thumbnail || '',
      image: image || '',
      contentType,
      durationWeeks,
      tariffs: [
        {
          access: 'paid',
          price: price ?? 0,
          durationDays,
        },
      ],
    })
  }
}
