import { injectable } from 'inversify'
import { UserId } from '@/kernel/domain/user'
import { ContentType, CourseId } from '@/kernel/domain/course'
import { CourseAccessReason, CourseUserAccess } from '../_domain/type'
import { UserAccessRepository } from '../_repository/user-access'
import { TRPCError } from '@trpc/server'
import { generateId } from '@/shared/lib/id'

type Command = {
  userId: UserId
  courseId: CourseId
  reason: CourseAccessReason
  adminId?: UserId
  contentType: ContentType
  expiresAt?: Date | null
}

@injectable()
export class GrandCourseAccessService {
  constructor(private readonly userAccessRepository: UserAccessRepository) {}
  async exec(command: Command) {
    const courseAccess = await this.userAccessRepository.findUserCourseAccess(
      command.userId,
      command.courseId,
      command.contentType
    )

    const hasActiveAccess = Boolean(
      courseAccess &&
        (courseAccess.expiresAt == null || courseAccess.expiresAt > new Date())
    )

    if (hasActiveAccess) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Course access already exists',
      })
    }

    const shouldKeepSetup =
      Boolean(courseAccess?.setupCompleted) &&
      (courseAccess?.expiresAt == null || courseAccess.expiresAt > new Date())

    const setupCompleted =
      command.contentType === 'SUBSCRIPTION' ? true : shouldKeepSetup

    const newCourseAccess: CourseUserAccess = {
      courseId: command.courseId,
      userId: command.userId,
      contentType: command.contentType,
      reason: command.reason,
      adminId: command.adminId,
      id: generateId(),
      expiresAt: command.expiresAt ?? null,
      enrollmentId: null,
      setupCompleted,
      freezes: [],
      freezeDaysUsed: 0,
    }

    return this.userAccessRepository.save(newCourseAccess, {
      action: 'grant',
    })
  }
}
