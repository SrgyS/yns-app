import { injectable } from 'inversify'

import { CreateUserCourseEnrollmentParams, UserCourseEnrollment } from '@/entities/course'
import {
  CreateUserCourseEnrollmentService,
  GetCourseService,
} from '@/entities/course/module'
import { CheckCourseAccessService } from '@/entities/user-access/module'

@injectable()
export class CreateUserCourseEnrollmentWithCourseAccessService {
  constructor(
    private readonly checkCourseAccess: CheckCourseAccessService,
    private readonly getCourseService: GetCourseService,
    private readonly createUserCourseEnrollment: CreateUserCourseEnrollmentService,
  ) {}

  async exec(
    params: CreateUserCourseEnrollmentParams,
  ): Promise<UserCourseEnrollment> {
    const course = await this.getCourseService.exec({ id: params.courseId })

    if (!course) {
      throw new Error('Курс не найден')
    }

    if (!course.product) {
      throw new Error('Некорректные данные курса: отсутствует продукт')
    }

    const hasAccess = await this.checkCourseAccess.exec({
      userId: params.userId,
      course: {
        id: course.id,
        product: course.product,
        contentType: course.contentType,
      },
    })

    if (!hasAccess) {
      throw new Error('Нет доступа к курсу')
    }

    return this.createUserCourseEnrollment.exec(params)
  }
}
