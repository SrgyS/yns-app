import { Prisma, ROLE } from '@prisma/client'
import { injectable } from 'inversify'

import { dbClient } from '@/shared/lib/db'
import { AdminUserListFilters, AdminUserListItem } from '../_domain/types'

type AdminUserRow = {
  id: string
  email: string
  name: string | null
  image: string | null
  phone: string | null
  role: ROLE
  hasActiveAccess: boolean
}

@injectable()
export class AdminUserRepository {
  async list(filters: AdminUserListFilters): Promise<{
    items: AdminUserListItem[]
    total: number
  }> {
    const whereConditions: Prisma.Sql[] = []

    const hasActiveAccessSql = Prisma.sql`
      EXISTS (
        SELECT 1
        FROM "UserAccess" ua
        WHERE ua."userId" = u.id
          AND (ua."expiresAt" IS NULL OR ua."expiresAt" > NOW())
      )
    `

    const escapeLikePattern = (value: string) =>
      value.replace(/[%_]/g, match => `\\${match}`)

    if (filters.id) {
      const escapedId = escapeLikePattern(filters.id)
      whereConditions.push(
        Prisma.sql`u.id::text ILIKE ${`%${escapedId}%`} ESCAPE '\\'`
      )
    }

    if (filters.email) {
      whereConditions.push(Prisma.sql`u.email ILIKE ${`%${filters.email}%`}`)
    }

    if (filters.name) {
      const escapedName = escapeLikePattern(filters.name)
      whereConditions.push(
        Prisma.sql`COALESCE(u.name, '') ILIKE ${`%${escapedName}%`} ESCAPE '\\'`
      )
    }

    if (filters.phone) {
      whereConditions.push(Prisma.sql`u.phone ILIKE ${`%${filters.phone}%`}`)
    }

    if (filters.hasActiveAccess === 'active') {
      whereConditions.push(hasActiveAccessSql)
    }

    if (filters.hasActiveAccess === 'inactive') {
      whereConditions.push(Prisma.sql`NOT ${hasActiveAccessSql}`)
    }

    if (filters.role) {
      whereConditions.push(Prisma.sql`u.role = ${filters.role}::"ROLE"`)
    }

    if (filters.hasAvatar === 'with') {
      whereConditions.push(
        Prisma.sql`u.image IS NOT NULL AND trim(u.image) <> ''`
      )
    }

    if (filters.hasAvatar === 'without') {
      whereConditions.push(Prisma.sql`(u.image IS NULL OR trim(u.image) = '')`)
    }

    const whereSql =
      whereConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
        : Prisma.sql``

    const offset = (filters.page - 1) * filters.pageSize

    const orderColumn =
      filters.sortBy === 'name'
        ? Prisma.sql`COALESCE(NULLIF(BTRIM(u.name), ''), u.email)`
        : Prisma.sql`u."createdAt"`
    const orderDirection =
      filters.sortDir === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`

    const rows = await dbClient.$queryRaw<AdminUserRow[]>(
      Prisma.sql`
        SELECT
          u.id,
          u.email,
          u.name,
          u.image,
          u.phone,
          u.role,
          ${hasActiveAccessSql} AS "hasActiveAccess"
        FROM "User" u
        ${whereSql}
        ORDER BY ${orderColumn} ${orderDirection}
        LIMIT ${filters.pageSize}
        OFFSET ${offset}
      `
    )

    const totalResult = await dbClient.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "User" u
        ${whereSql}
      `
    )

    const total = Number(totalResult[0]?.count ?? 0)

    return {
      items: rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        image: row.image,
        phone: row.phone,
        role: row.role,
        hasActiveAccess: row.hasActiveAccess,
      })),
      total,
    }
  }
}
