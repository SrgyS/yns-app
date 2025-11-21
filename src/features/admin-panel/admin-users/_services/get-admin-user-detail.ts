import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'
import { formatISO } from 'date-fns'

import { StaffPermissionService } from './staff-permissions'
import {
  AdminUserAccess,
  AdminUserDetail,
  AdminUserPayment,
  AdminUserProfile,
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
        sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
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

    const lastActivityAt =
      user.sessions[0]?.updatedAt ?? user.updatedAt ?? user.createdAt

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
    const adminIds = Array.from(
      new Set(
        accessesDb
          .flatMap(access => [access.adminId, access.history[0]?.adminId])
          .filter((id): id is string => !!id)
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

    const accesses: AdminUserAccess[] = accessesDb.map(access => {
      const closedEntry = access.history[0]
      const closedAdmin = closedEntry?.adminId
        ? adminMap.get(closedEntry.adminId)
        : null
      const freezes =
        Array.isArray(access.freezes) && access.freezes.length > 0
          ? (access.freezes
              .map(freeze => {
                if (
                  freeze &&
                  typeof freeze === 'object' &&
                  'start' in freeze &&
                  'end' in freeze &&
                  'id' in freeze
                ) {
                  return {
                    id: String((freeze as any).id),
                    start: formatISO(new Date((freeze as any).start)),
                    end: formatISO(new Date((freeze as any).end)),
                  }
                }
                return null
              })
              .filter(Boolean) as { id: string; start: string; end: string }[])
          : []

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
        freezes,
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

    return {
      profile,
      accesses,
      payments,
    }
  }
}
