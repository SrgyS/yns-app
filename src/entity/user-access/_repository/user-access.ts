import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { CourseId } from '@/kernel/domain/course'
import { UserId } from '@/kernel/domain/user'
import { CourseUserAccess, UserAccess, UserAccessType } from '../_domain/type'



@injectable()
export class UserAccessRepository {
  async findUserCourseAccess(
    userId: UserId,
    courseId: CourseId,
    type: UserAccessType
  ): Promise<CourseUserAccess | undefined> {
    const userAccessDb = await this.queryCourseUserAccess(
      userId,
      courseId,
      type
    )
    if (!userAccessDb) {
      return undefined
    }
    const userAccess = this.dbUserAccessToUserAccess(userAccessDb)

    if (userAccess.type) {
      return userAccess
    }
  }

  async save(userAccess: UserAccess): Promise<UserAccess> {
    return this.dbUserAccessToUserAccess(
      await dbClient.userAccess.upsert({
        where: {
          userId_courseId_type: {
            userId: userAccess.userId,
            courseId: userAccess.courseId,
            type: userAccess.type
          }
        },
        create: {
          id: userAccess.id,
          userId: userAccess.userId,
          type: userAccess.type,
          reason: userAccess.reason,
          courseId: userAccess.courseId,
          adminId: userAccess.adminId,
          enrollmentId: userAccess.enrollmentId
        },
        update: {
          reason: userAccess.reason,
          adminId: userAccess.adminId,
          enrollmentId: userAccess.enrollmentId
        },
      })
    )
  }

  private dbUserAccessToUserAccess(
    userAccess: NotNull<
      Awaited<ReturnType<UserAccessRepository['queryCourseUserAccess']>>
    >
  ): UserAccess {
    return {
      courseId: userAccess.courseId,
      userId: userAccess.userId,
      type: userAccess.type,
      reason: userAccess.reason,
      adminId: userAccess.adminId ?? undefined,
      id: userAccess.id,
      enrollmentId: userAccess.enrollmentId ?? null,
    }
  }

  private queryCourseUserAccess(
    userId: UserId,
    courseId: CourseId,
    type: UserAccessType
  ) {
    return dbClient.userAccess.findFirst({
      where: {
        userId,
        courseId,
        type,
      },
    })
  }
}

type NotNull<T> = T extends null ? never : T
