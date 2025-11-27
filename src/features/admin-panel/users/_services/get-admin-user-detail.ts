import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { formatISO } from 'date-fns'

import { StaffPermissionService } from './staff-permissions'
import {
  AdminUserAccess,
  AdminUserDetail,
  AdminUserActivity,
  AdminUserPayment,
  AdminUserProfile,
  AdminUserFreeze,
} from '../_domain/user-detail'

@injectable()
export class GetAdminUserDetailService {
  constructor(
    private readonly staffPermissionService: StaffPermissionService
  ) {}

  async exec(userId: string): Promise<AdminUserDetail> {
    const user = await dbClient.user.findUnique({
      where: { id: userId },
      include: {
        staffPermission: true,
      },
    })

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    const permissions = await this.staffPermissionService.getPermissionsForUser(
      {
        id: user.id,
        role: user.role,
      }
    )

    const lastActivity =
      (await dbClient.userActivity.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })) ?? null

    const lastActivityAt =
      user.lastActivityAt ??
      lastActivity?.createdAt ??
      user.updatedAt ??
      user.createdAt

    const profile: AdminUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      image: user.image ?? null,
      role: user.role,
      createdAt: formatISO(user.createdAt),
      lastActivityAt: lastActivityAt ? formatISO(lastActivityAt) : null,
      staffPermissions: permissions,
    }

    const accessesDb = await dbClient.userAccess.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        history: {
          where: { action: 'close' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    const courseIds = Array.from(
      new Set(accessesDb.map(access => access.courseId))
    )
    const freezeHistory = await dbClient.userFreeze.findMany({
      where: { userId },
      orderBy: { start: 'desc' },
    })

    const adminIds = Array.from(
      new Set(
        [
          ...accessesDb.flatMap(access => [
            access.adminId,
            access.history[0]?.adminId,
          ]),
          ...freezeHistory.flatMap(entry => [entry.createdBy, entry.canceledBy]),
        ].filter((id): id is string => Boolean(id))
      )
    )

    const courses =
      courseIds.length > 0
        ? await dbClient.course.findMany({
            where: { id: { in: courseIds } },
            select: {
              id: true,
              title: true,
              contentType: true,
            },
          })
        : []

    const courseMap = new Map(courses.map(course => [course.id, course]))

    const admins =
      adminIds.length > 0
        ? await dbClient.user.findMany({
            where: { id: { in: adminIds } },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : []

    const adminMap = new Map(admins.map(admin => [admin.id, admin]))

    const freezes: AdminUserFreeze[] = freezeHistory.map(entry => ({
      id: entry.id,
      start: formatISO(entry.start),
      end: formatISO(entry.end),
      createdAt: formatISO(entry.createdAt),
      createdBy: entry.createdBy
        ? adminMap.get(entry.createdBy)?.name ?? null
        : null,
      canceledAt: entry.canceledAt ? formatISO(entry.canceledAt) : null,
      canceledBy: entry.canceledBy
        ? adminMap.get(entry.canceledBy)?.name ?? null
        : null,
    }))

    const accesses: AdminUserAccess[] = accessesDb.map(access => {
      const closedEntry = access.history[0]
      const closedAdmin = closedEntry?.adminId
        ? adminMap.get(closedEntry.adminId)
        : null

      return {
        id: access.id,
        courseId: access.courseId,
        courseTitle: courseMap.get(access.courseId)?.title ?? 'Без названия',
        contentType:
          courseMap.get(access.courseId)?.contentType ?? 'FIXED_COURSE',
        reason: access.reason,
        adminName: access.adminId
          ? (adminMap.get(access.adminId)?.name ?? null)
          : null,
        adminEmail: access.adminId
          ? (adminMap.get(access.adminId)?.email ?? null)
          : null,
        closedByName: closedAdmin?.name ?? null,
        closedAt: closedEntry?.createdAt
          ? formatISO(closedEntry.createdAt)
          : null,
        createdAt: formatISO(access.createdAt),
        startsAt: access.createdAt ? formatISO(access.createdAt) : null,
        expiresAt: access.expiresAt ? formatISO(access.expiresAt) : null,
        isActive: !access.expiresAt || access.expiresAt.getTime() > Date.now(),
        freezes: freezes.map(freeze => ({
          id: freeze.id,
          start: freeze.start,
          end: freeze.end,
          canceledAt: freeze.canceledAt,
        })),
      }
    })

    const paymentsDb = await dbClient.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        products: true,
      },
    })

    const payments: AdminUserPayment[] = paymentsDb.map(payment => ({
      id: payment.id,
      createdAt: formatISO(payment.createdAt),
      amount: payment.products.reduce(
        (acc, product) => acc + product.price * product.quantity,
        0
      ),
      state: payment.state,
      products: payment.products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
      })),
    }))

    const paidActivityDb = await dbClient.userPaidActivity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 180,
    })

    const activity: AdminUserActivity[] = paidActivityDb.map(entry => ({
      date: formatISO(entry.date),
      path: entry.path ?? null,
      menu: entry.menu ?? null,
    }))

    return {
      profile,
      accesses,
      freezes,
      payments,
      activity,
    }
  }
}
