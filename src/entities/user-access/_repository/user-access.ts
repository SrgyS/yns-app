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

  async findUserCoursesAccessMap(
    userId: UserId,
    courseIds: CourseId[],
    db: DbClient = dbClient
  ): Promise<Map<string, CourseUserAccess>> {
    if (courseIds.length === 0) {
      return new Map()
    }

    const userAccesses = await db.userAccess.findMany({
      where: {
        userId,
        courseId: {
          in: courseIds,
        },
      },
    })

    const result = new Map<string, CourseUserAccess>()
    for (const access of userAccesses) {
      const key = this.getAccessMapKey(access.courseId, access.contentType)
      result.set(key, this.dbUserAccessToUserAccess(access))
    }

    return result
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
    userAccess: Awaited<
      ReturnType<UserAccessRepository['queryCourseUserAccess']>
    >
  ): CourseUserAccess {
    if (!userAccess) {
      throw new Error('Cannot map empty user access entity')
    }
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

  private getAccessMapKey(courseId: CourseId, contentType: ContentType) {
    return `${courseId}:${contentType}`
  }
}
