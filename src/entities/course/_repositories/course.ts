import { injectable } from 'inversify'
import {
  Course as PrismaCourse,
  CourseTariff as PrismaCourseTariff,
  AccessType,
} from '@prisma/client'
import { Course, CourseAccessInfo } from '@/entities/course'
import { CourseId, CourseSlug, CourseTariff } from '@/kernel/domain/course'
import { dbClient } from '@/shared/lib/db'
import { compileMDX } from '@/shared/lib/mdx/server'
import { logger } from '@/shared/lib/logger'
import { CreateCourseInput } from '../_domain/types'

@injectable()
export class CoursesRepository {

  async create(data: CreateCourseInput) {
    return dbClient.course.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        thumbnail: data.thumbnail,
        image: data.image,
        durationWeeks: data.durationWeeks,
        contentType: data.contentType,
        draft: true,
        tariffs: {
          create: data.tariffs.map(tariff => ({
            access: AccessType.paid,
            price: tariff.price,
            durationDays: tariff.durationDays,
            feedback: tariff.feedback ?? false,
          })),
        },
      },
    })
  }

  async coursesList(options: { includeDrafts?: boolean } = {}): Promise<Course[]> {
    const { includeDrafts = false } = options
    const courses = await dbClient.course.findMany({
      where: includeDrafts ? undefined : { draft: false },
      include: { dependencies: true, tariffs: true },
    })

    return Promise.all(courses.map(course => this.mapPrismaToDomain(course)))
  }

  async courseById(courseId: CourseId): Promise<Course | undefined> {
    const course = await dbClient.course.findUnique({
      where: { id: courseId },
      include: { dependencies: true, tariffs: true },
    })
    return course ? this.mapPrismaToDomain(course) : undefined
  }

  async courseBySlug(courseSlug: CourseSlug): Promise<Course | undefined> {
    const course = await dbClient.course.findUnique({
      where: { slug: courseSlug },
      include: { dependencies: true, tariffs: true },
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
        tariffs: true,
      },
    })

    return courses.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      contentType: course.contentType ?? 'FIXED_COURSE',
      tariffs: course.tariffs.map(tariff => ({
        id: tariff.id,
        access: 'paid',
        price: tariff.price ?? 0,
        durationDays: tariff.durationDays ?? 0,
        feedback: tariff.feedback,
      })),
    }))
  }

  async deleteById(courseId: string) {
    return dbClient.$transaction(async tx => {
      await tx.userCourseEnrollment.deleteMany({
        where: { courseId },
      })
      return tx.course.delete({ where: { id: courseId } })
    })
  }
  private async safeCompileMDX(
    source: string | null | undefined
  ): Promise<string> {
    if (!source) return ''
    try {
      const result = await compileMDX(source)
      return result.code
    } catch (error) {
      logger.warn({ err: error }, 'Ошибка компиляции MDX')
      return ''
    }
  }
  private async mapPrismaToDomain(
    course: PrismaCourse & {
      dependencies: { id: string }[]
      tariffs: PrismaCourseTariff[]
    }
  ): Promise<Course> {
    const compiledDescription = await this.safeCompileMDX(course.description)
    const compiledShortDescription = await this.safeCompileMDX(
      course.shortDescription
    )

    const tariffs: CourseTariff[] = course.tariffs.map(tariff => ({
      id: tariff.id,
      access: 'paid',
      price: tariff.price ?? 0,
      durationDays: tariff.durationDays ?? 0,
      feedback: tariff.feedback,
    }))

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: compiledDescription,
      shortDescription: compiledShortDescription || undefined,
      image: course.image,
      thumbnail: course.thumbnail,
      dependencies: course.dependencies?.map(dep => dep.id) ?? [],
      tariffs,
      draft: course.draft,
      durationWeeks: course.durationWeeks,
      showRecipes: course.showRecipes ?? false,
      allowedWorkoutDaysPerWeek:
        course.allowedWorkoutDaysPerWeek &&
        course.allowedWorkoutDaysPerWeek.length > 0
          ? course.allowedWorkoutDaysPerWeek
          : [5],
      contentType: course.contentType,
    }
  }
}
