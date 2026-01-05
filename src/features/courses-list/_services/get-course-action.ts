import { GetCourseService } from '@/entities/course/module'
import { injectable } from 'inversify'
import { CourseAction } from '../_domain/types'
import { CourseId } from '@/kernel/domain/course'
import { TRPCError } from '@trpc/server'
import { UserId } from '@/kernel/domain/user'
import { getCourseAction } from '../_domain/methods'

type Query = {
  courseId: CourseId
  userId?: UserId
}

@injectable()
export class GetCourseActionService {
  constructor(private getCourseService: GetCourseService) {}
  async exec(query: Query): Promise<CourseAction> {
    const course = await this.getCourseService.exec({ id: query.courseId })

    if (!course) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Course ${query.courseId} not found`,
      })
    }

    return getCourseAction({
      course,
    })
  }
}
