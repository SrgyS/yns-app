import { injectable } from 'inversify'
import { startOfWeek } from 'date-fns'

import {
  CreateUserCourseEnrollmentParams,
  UserCourseEnrollment,
} from '@/entities/course'
import {
  CreateUserCourseEnrollmentService,
  GetCourseService,
} from '@/entities/course/module'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'

@injectable()
export class CreateUserCourseEnrollmentWithCourseAccessService {
  constructor(
    private readonly checkCourseAccess: CheckCourseAccessService,
    private readonly getCourseService: GetCourseService,
    private readonly createUserCourseEnrollment: CreateUserCourseEnrollmentService,
    private readonly userAccessRepository: UserAccessRepository,
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(
    params: CreateUserCourseEnrollmentParams
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

    const userAccess = await this.userAccessRepository.findUserCourseAccess(
      params.userId,
      params.courseId,
      course.contentType
    )

    if (!userAccess) {
      throw new Error('Доступ к курсу не найден')
    }

    const existingEnrollment =
      await this.userCourseEnrollmentRepository.getEnrollment(
        params.userId,
        params.courseId
      )

    const shouldReuseExisting =
      course.contentType === 'SUBSCRIPTION' &&
      Boolean(userAccess.setupCompleted) &&
      Boolean(existingEnrollment) &&
      (existingEnrollment?.selectedWorkoutDays.length ?? 0) > 0 &&
      params.selectedWorkoutDays.length === 0

    const selectedWorkoutDays =
      params.selectedWorkoutDays.length > 0
        ? params.selectedWorkoutDays
        : (existingEnrollment?.selectedWorkoutDays ?? [])

    if (!shouldReuseExisting && selectedWorkoutDays.length === 0) {
      throw new Error('Не выбраны дни тренировок')
    }

    const startDate =
      course.contentType === 'SUBSCRIPTION'
        ? startOfWeek(params.startDate, { weekStartsOn: 1 })
        : params.startDate

    const enrollment = await this.createUserCourseEnrollment.exec(
      {
        ...params,
        courseContentType: course.contentType,
        selectedWorkoutDays,
        startDate,
      },
      {
        reuseExistingEnrollment: shouldReuseExisting,
        existingEnrollment,
      }
    )

    const setupCompleted =
      course.contentType === 'SUBSCRIPTION' ||
      selectedWorkoutDays.length > 0 ||
      shouldReuseExisting

    await this.userAccessRepository.save({
      ...userAccess,
      enrollmentId: enrollment.id,
      setupCompleted,
    })

    return enrollment
  }
}
