import { injectable } from 'inversify'
import { allSuccess } from '@/shared/lib/promise'
import { dbClient } from '@/shared/lib/db'
import { Course, CourseProduct } from '../_domain/course'
import { logger } from '@/shared/lib/logger'
import {
  CourseDependency as PrismaCourseDependency,
  Course as PrismaCourse,
  CourseProduct as PrismaCourseProduct,
} from '@prisma/client'
import { compileMDX } from '@/shared/lib/mdx/server'

@injectable()
export class CoursesRepository {
  private mapPrismaProductToDomain(
    prismaProduct: PrismaCourseProduct | null | undefined
  ): CourseProduct | undefined {
    if (!prismaProduct) {
      return undefined // Если продукта нет, возвращаем undefined
    }

    if (prismaProduct.access === 'free') {
      return { access: 'free' } // Создаем объект 'free' без поля price
    }

    if (prismaProduct.access === 'paid') {
      // Строгая проверка: price должен быть числом и не null
      if (
        typeof prismaProduct.price === 'number' &&
        prismaProduct.price !== null
      ) {
        return { access: 'paid', price: prismaProduct.price }
      } else {
        // Если product.access === 'paid', но price некорректен, логируем и возвращаем undefined
        logger.warn(
          `Product ${prismaProduct.id} for course has access 'paid' but missing or invalid price.`
        )
        return undefined // Не создаем некорректный продукт
      }
    }

    // Если access имеет неожиданное значение (не 'free' и не 'paid')
    logger.error(
      `Unknown product access type: ${prismaProduct.access} for product ID: ${prismaProduct.id}`
    )
    return undefined
  }
  private async mapPrismaCourseToDomain(
    prismaCourse: PrismaCourse & {
      dependencies: PrismaCourseDependency[]
      product: PrismaCourseProduct | null
    }
  ): Promise<Course> {
    const compiledDescription = (await compileMDX(prismaCourse.description))
      .code

    const compiledShortDescription = prismaCourse.shortDescription
      ? (await compileMDX(prismaCourse.shortDescription)).code
      : undefined

    // Извлекаем ID зависимостей
    const dependencies = prismaCourse.dependencies.map(dep => dep.dependsOnId)

    return {
      id: prismaCourse.id,
      title: prismaCourse.title,
      description: compiledDescription,
      slug: prismaCourse.slug,
      image: prismaCourse.image,
      thumbnail: prismaCourse.thumbnail,
      shortDescription: compiledShortDescription,
      draft: prismaCourse.draft,
      durationWeeks: prismaCourse.durationWeeks,
      dependencies: dependencies,
      product: this.mapPrismaProductToDomain(prismaCourse.product),
    }
  }

  async coursesList(): Promise<Course[]> {
    const prismaCourses = await dbClient.course.findMany({
      include: {
        dependencies: true, // Prisma автоматически включит 'dependent' из-за @relation
        product: true,
      },
    })

    if (prismaCourses.length === 0) {
      logger.warn('No courses found in the database')
      return []
    }

    const mappedCourses = await allSuccess(
      prismaCourses.map(this.mapPrismaCourseToDomain.bind(this)),
      (value, i) => {
        if (value.status === 'rejected') {
          logger.error({
            msg: 'Error processing course from DB during list fetch',
            slug: prismaCourses[i].slug,
            error: value.reason,
          })
        }
      }
    )

    return mappedCourses
  }
}
