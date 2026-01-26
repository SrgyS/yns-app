import { injectable } from 'inversify'

import {
  GrandCourseAccessService,
  UserAccessRepository,
} from '@/entities/user-access/module'
import {
  CreateUserCourseEnrollmentService,
  GetCourseService,
} from '@/entities/course/module'

type GrantAccessParams = {
  userId: string
  courseId: string
  adminId: string
  expiresAt?: Date | null
}

@injectable()
export class GrantCourseAccessService {
  constructor(
    private readonly getCourseService: GetCourseService,
    private readonly grandCourseAccessService: GrandCourseAccessService,
    private readonly createUserCourseEnrollmentService: CreateUserCourseEnrollmentService,
    private readonly userAccessRepository: UserAccessRepository
  ) {}

  async exec(params: GrantAccessParams) {
    const course = await this.getCourseService.exec({ id: params.courseId })

    if (!course) {
      throw new Error('Курс не найден')
    }

    if (course.tariffs.length === 0) {
      throw new Error('Нельзя выдать доступ к курсу без тарифов')
    }

    const savedAccess = await this.grandCourseAccessService.exec({
      userId: params.userId,
      courseId: course.id,
      reason: 'manual',
      adminId: params.adminId,
      contentType: course.contentType,
      expiresAt: params.expiresAt ?? null,
    })

    const enrollment = await this.createUserCourseEnrollmentService.exec(
      {
        userId: params.userId,
        courseId: course.id,
        courseContentType: course.contentType,
        startDate: new Date(),
        selectedWorkoutDays: [],
      },
      {
        skipPlanGeneration: true,
        forceNewEnrollment: true,
      }
    )

    await this.userAccessRepository.save(
      {
        ...savedAccess,
        enrollmentId: enrollment.id,
        setupCompleted: false,
      },
      { action: 'grant' }
    )
  }
}
