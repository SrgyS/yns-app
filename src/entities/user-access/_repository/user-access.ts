import { injectable } from 'inversify'
import { dbClient, type DbClient } from '@/shared/lib/db'
import { ContentType, CourseId } from '@/kernel/domain/course'
import { UserId } from '@/kernel/domain/user'
import { CourseUserAccess, UserAccess } from '../_domain/type'

@injectable()
export class UserAccessRepository {
  async findUserCourseAccess(
    userId: UserId,
    courseId: CourseId,
    contentType: ContentType,
    db: DbClient = dbClient
  ): Promise<CourseUserAccess | undefined> {
    const userAccessDb = await this.queryCourseUserAccess(
      userId,
      courseId,
      contentType,
      db
    )
    if (!userAccessDb) {
      return undefined
    }
    const userAccess = this.dbUserAccessToUserAccess(userAccessDb)
    return userAccess
  }

  async save(userAccess: UserAccess, db: DbClient = dbClient): Promise<UserAccess> {
    return this.dbUserAccessToUserAccess(
      await db.userAccess.upsert({
        where: {
          userId_courseId_contentType: {
            userId: userAccess.userId,
            courseId: userAccess.courseId,
            contentType: userAccess.contentType,
          },
        },
        create: {
          id: userAccess.id,
          userId: userAccess.userId,
          courseId: userAccess.courseId,
          contentType: userAccess.contentType,
          reason: userAccess.reason,
          adminId: userAccess.adminId,
          enrollmentId: userAccess.enrollmentId ?? null,
          setupCompleted: userAccess.setupCompleted,
          expiresAt: userAccess.expiresAt ?? null,
        },
        update: {
          reason: userAccess.reason,
          adminId: userAccess.adminId,
          enrollmentId: userAccess.enrollmentId ?? null,
          setupCompleted: userAccess.setupCompleted,
          expiresAt: userAccess.expiresAt ?? null,
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
      contentType: userAccess.contentType,
      reason: userAccess.reason,
      adminId: userAccess.adminId ?? undefined,
      id: userAccess.id,
      enrollmentId: userAccess.enrollmentId ?? null,
      expiresAt: userAccess.expiresAt ?? null,
      setupCompleted: userAccess.setupCompleted,
    }
  }

  private queryCourseUserAccess(
    userId: UserId,
    courseId: CourseId,
    contentType: ContentType,
    db: DbClient = dbClient
  ) {
    return db.userAccess.findFirst({
      where: {
        userId,
        courseId,
        contentType,
      },
    })
  }
}

type NotNull<T> = T extends null ? never : T
