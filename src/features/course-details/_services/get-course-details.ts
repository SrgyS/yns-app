
import { injectable } from "inversify";
import { CourseDetails } from "../_domain/types";
import { CourseSlug } from "@/kernel/domain/course";
import { TRPCError } from "@trpc/server";
// import { createCourseDetails } from "../_domain/factory";
import { GetCourseService } from '@/entities/course/module'

type Query = {
  courseSlug: CourseSlug;
};

@injectable()
export class GetCourseDetailsService {
  constructor(
    private getCourseService: GetCourseService,
  ) {}
  async exec(query: Query): Promise<CourseDetails> {
    const course = await this.getCourseService.exec({ slug: query.courseSlug })
 
    if (!course) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${query.courseSlug} not found`,
      })
    }

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      image: course.image || '',
    }
  }
}