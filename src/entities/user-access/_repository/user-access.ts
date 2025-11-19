import { injectable } from 'inversify'
import { dbClient, type DbClient } from '@/shared/lib/db'
import { ContentType, CourseId } from '@/kernel/domain/course'
import { UserId } from '@/kernel/domain/user'
import { CourseUserAccess, UserAccess } from '../_domain/type'
import {
  LogUserAccessHistoryService,
  type UserAccessHistoryAction,
} from '../_services/log-user-access-history'

@injectable()
export class UserAccessRepository {
  constructor(private readonly logHistory: LogUserAccessHistoryService) {}
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

  async findActiveAccessByCourse(
    userId: UserId,
    courseId: CourseId,
    db: DbClient = dbClient
  ): Promise<CourseUserAccess | undefined> {
    const courseUserAccess = await db.userAccess.findFirst({
      where: {
        userId,
        courseId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return courseUserAccess
      ? this.dbUserAccessToUserAccess(courseUserAccess)
      : undefined
  }

  async findActiveAccesses(
    userId: UserId,
    db: DbClient = dbClient
  ): Promise<CourseUserAccess[]> {
    const records = await db.userAccess.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return records.map(record => this.dbUserAccessToUserAccess(record))
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    const result = new Map<string, CourseUserAccess>()
    for (const access of userAccesses) {
      const key = this.getAccessMapKey(access.courseId, access.contentType)
      if (result.has(key)) {
        continue
      }
      result.set(key, this.dbUserAccessToUserAccess(access))
    }

    return result
  }

  async save(
    userAccess: UserAccess,
    options?: {
      db?: DbClient
      action?: UserAccessHistoryAction
      payload?: Record<string, unknown>
    }
  ): Promise<UserAccess> {
    const db = options?.db ?? dbClient
    const saved = await db.userAccess.upsert({
      where: {
        id: userAccess.id,
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

    await this.logHistory.log(
      {
        userAccessId: saved.id,
        action: options?.action ?? 'save',
        adminId: userAccess.adminId,
        payload: options?.payload ?? {
          reason: saved.reason,
          enrollmentId: saved.enrollmentId,
          expiresAt: saved.expiresAt,
          setupCompleted: saved.setupCompleted,
        },
      },
      db
    )

    return this.dbUserAccessToUserAccess(saved)
  }

  async findById(id: string, db: DbClient = dbClient) {
    const record = await db.userAccess.findUnique({ where: { id } })
    return record ? this.dbUserAccessToUserAccess(record) : undefined
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
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  private getAccessMapKey(courseId: CourseId, contentType: ContentType) {
    return `${courseId}:${contentType}`
  }
}
