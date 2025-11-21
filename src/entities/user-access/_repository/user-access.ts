import { injectable } from 'inversify'
import { dbClient, type DbClient } from '@/shared/lib/db'
import { ContentType, CourseId } from '@/kernel/domain/course'
import { UserId } from '@/kernel/domain/user'
import { CourseUserAccess, UserAccessFreezePeriod } from '../_domain/type'
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
    userAccess: CourseUserAccess,
    options?: {
      db?: DbClient
      action?: UserAccessHistoryAction
      payload?: Record<string, unknown>
    }
  ): Promise<CourseUserAccess> {
    const db = options?.db ?? dbClient
    const freezes = userAccess.freezes ?? []
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
        freezes: this.serializeFreezes(freezes),
        freezeDaysUsed: userAccess.freezeDaysUsed ?? 0,
      },
      update: {
        reason: userAccess.reason,
        adminId: userAccess.adminId,
        enrollmentId: userAccess.enrollmentId ?? null,
        setupCompleted: userAccess.setupCompleted,
        expiresAt: userAccess.expiresAt ?? null,
        freezes: this.serializeFreezes(freezes),
        freezeDaysUsed: userAccess.freezeDaysUsed ?? 0,
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
          freezes: saved.freezes,
          freezeDaysUsed: saved.freezeDaysUsed,
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
      freezes: this.parseFreezes(userAccess.freezes),
      freezeDaysUsed: userAccess.freezeDaysUsed ?? 0,
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

  private parseFreezes(value: unknown): UserAccessFreezePeriod[] {
    if (!Array.isArray(value)) {
      return []
    }

    const result: UserAccessFreezePeriod[] = []
    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue
      }
      const { id, start, end, createdBy, createdAt } = item as Record<
        string,
        unknown
      >
      if (
        typeof id !== 'string' ||
        typeof start !== 'string' ||
        typeof end !== 'string'
      ) {
        continue
      }
      let normalizedCreatedBy: string | null | undefined
      if (typeof createdBy === 'string') {
        normalizedCreatedBy = createdBy
      } else if (createdBy === null) {
        normalizedCreatedBy = null
      }
      result.push({
        id,
        start: new Date(start),
        end: new Date(end),
        createdBy: normalizedCreatedBy,
        createdAt: new Date(typeof createdAt === 'string' ? createdAt : start),
      })
    }
    return result
  }

  private serializeFreezes(freezes: UserAccessFreezePeriod[]) {
    return freezes.map(freeze => ({
      ...freeze,
      start: freeze.start.toISOString(),
      end: freeze.end.toISOString(),
      createdAt: freeze.createdAt.toISOString(),
    }))
  }
}
