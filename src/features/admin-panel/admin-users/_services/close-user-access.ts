import { injectable } from 'inversify'

import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'

@injectable()
export class CloseUserAccessService {
  constructor(
    private readonly userAccessRepository: UserAccessRepository,
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(params: { accessId: string; adminId: string }) {
    const currentAccess = await this.userAccessRepository.findById(params.accessId)

    if (!currentAccess) {
      throw new Error('Доступ не найден')
    }

    const now = new Date()

    await this.userAccessRepository.save(
      {
        ...currentAccess,
        adminId: params.adminId,
        expiresAt: now,
        setupCompleted: false,
      },
      {
        action: 'close',
        payload: {
          closedAt: now,
        },
      }
    )

    if (currentAccess.enrollmentId) {
      await this.userCourseEnrollmentRepository.updateEnrollmentOnClose(
        currentAccess.enrollmentId
      )
    }
  }
}
