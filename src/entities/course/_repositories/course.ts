import { injectable } from 'inversify'
import { Course as PrismaCourse } from '@prisma/client'
import { Course, CourseAccessInfo } from '@/entities/course'
import { CourseId, CourseProduct, CourseSlug } from '@/kernel/domain/course'
import { dbClient } from '@/shared/lib/db'
import { compileMDX } from '@/shared/lib/mdx/server'
import { logger } from '@/shared/lib/logger'

@injectable()
export class CoursesRepository {
  private async safeCompileMDX(
    source: string | null | undefined
  ): Promise<string> {
    if (!source) return ''
    try {
      const result = await compileMDX(source)
      return result.code
    } catch (error) {
      logger.warn('Ошибка компиляции MDX:', error)
      return ''
    }
  }
  private async mapPrismaToDomain(
    course: PrismaCourse & {
      product: { access: string; price: number | null; accessDurationDays: number | null } | null
      dependencies: { id: string }[]
    }
  ): Promise<Course> {
    const compiledDescription = await this.safeCompileMDX(course.description)
    const compiledShortDescription = await this.safeCompileMDX(
      course.shortDescription
    )

    const product: CourseProduct =
      course.product?.access === 'paid'
        ? {
            access: 'paid',
            price: course.product.price ?? 0,
            accessDurationDays: course.product.accessDurationDays ?? 0,
          }
        : { access: 'free' }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: compiledDescription,
      shortDescription: compiledShortDescription || undefined,
      image: course.image,
      thumbnail: course.thumbnail,
      dependencies: course.dependencies?.map(dep => dep.id) ?? [],
      product,
      draft: course.draft,
      durationWeeks: course.durationWeeks,
      allowedWorkoutDaysPerWeek:
        course.allowedWorkoutDaysPerWeek &&
        course.allowedWorkoutDaysPerWeek.length > 0
          ? course.allowedWorkoutDaysPerWeek
          : [5],
      contentType: course.contentType,
    }
  }
  async coursesList(): Promise<Course[]> {
    const courses = await dbClient.course.findMany({
      where: { draft: false },
      include: { product: true, dependencies: true },
    })

    return Promise.all(courses.map(course => this.mapPrismaToDomain(course)))
  }

  async courseById(courseId: CourseId): Promise<Course | undefined> {
    const course = await dbClient.course.findUnique({
      where: { id: courseId },
      include: { product: true, dependencies: true },
    })
    return course ? this.mapPrismaToDomain(course) : undefined
  }

  async courseBySlug(courseSlug: CourseSlug): Promise<Course | undefined> {
    const course = await dbClient.course.findUnique({
      where: { slug: courseSlug },
      include: { product: true, dependencies: true },
    })
    return course ? this.mapPrismaToDomain(course) : undefined
  }

  async getCoursesForAccessCheck(
    courseIds: CourseId[]
  ): Promise<CourseAccessInfo[]> {
    if (courseIds.length === 0) {
      return []
    }

    const courses = await dbClient.course.findMany({
      where: {
        id: {
          in: courseIds,
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        contentType: true,
        product: {
          select: {
            access: true,
            price: true,
            accessDurationDays: true,
          },
        },
      },
    })

    return courses.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      contentType: course.contentType ?? 'FIXED_COURSE',
      product:
        course.product?.access === 'paid'
          ? {
              access: 'paid',
              price: course.product.price ?? 0,
              accessDurationDays: course.product.accessDurationDays ?? 0,
            }
          : { access: 'free' },
    }))
  }
}
