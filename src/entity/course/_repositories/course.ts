import { injectable } from 'inversify'
import { Course } from '@/entity/course'
import { CourseId, CourseSlug } from '@/kernel/domain/course'
import { dbClient } from '@/shared/lib/db'

@injectable()
export class CoursesRepository {
  async coursesList(): Promise<Course[]> {
    const courses = await dbClient.course.findMany({
      where: {
        draft: false,
      },
      include: {
        product: true,
        dependencies: true,
      },
    })

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      image: course.image,
      thumbnail: course.thumbnail,
      dependencies: course.dependencies?.map(dep => dep.id) ?? [],
      shortDescription: course.shortDescription ?? undefined,
      product: course.product
        ? course.product.access === 'paid'
          ? { access: 'paid', price: course.product.price ?? 0 }
          : { access: 'free' }
        : { access: 'free' },
      draft: course.draft,
      durationWeeks: course.durationWeeks,
    }))
  }

  async courseById(courseId: CourseId) {
    const list = await this.coursesList()

    return list.find(course => course.id === courseId)
  }

  async courseSlug(courseSlug: CourseSlug) {
    const list = await this.coursesList()

    return list.find(course => course.slug === courseSlug)
  }
}
