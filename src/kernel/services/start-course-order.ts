import { injectable } from 'inversify'
import { CourseSlug } from '../domain/course'
import { UserId } from '../domain/user'

export type StartCourseOrderCommand = {
  courseSlug: CourseSlug
  userId: UserId
}

export type StartCourseOrderResult = {
  redirectUrl: string
}

@injectable()
export abstract class StartCourseOrderService {
  abstract exec(data: StartCourseOrderCommand): Promise<StartCourseOrderResult>
}
