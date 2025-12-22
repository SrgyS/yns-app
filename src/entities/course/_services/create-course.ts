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

    const {
      title,
      slug,
      description,
      shortDescription,
      thumbnail,
      image,
      contentType,
      access,
      price,
      durationWeeks,
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
      product: {
        access: access === AccessType.paid ? 'paid' : 'free',
        price: access === AccessType.paid ? (price ?? 0) : 0,
      },
    })
  }
}
