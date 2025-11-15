import { injectable } from 'inversify'

import {
  AdminUserListFilters,
  AdminUserListResult,
} from '../_domain/types'
import { AdminUserRepository } from '../_repositories/admin-user-repository'

@injectable()
export class ListAdminUsersService {
  constructor(private readonly repository: AdminUserRepository) {}

  async exec(filters: AdminUserListFilters): Promise<AdminUserListResult> {
    const sanitizedFilters: AdminUserListFilters = {
      ...filters,
      id: filters.id?.trim() || undefined,
      email: filters.email?.trim() || undefined,
      phone: filters.phone?.trim() || undefined,
      hasAvatar: filters.hasAvatar ?? 'any',
      hasActiveAccess: filters.hasActiveAccess ?? 'any',
      sortBy: filters.sortBy ?? 'createdAt',
      sortDir: filters.sortDir ?? 'desc',
    }

    const { items, total } = await this.repository.list(sanitizedFilters)

    const page = sanitizedFilters.page
    const pageSize = sanitizedFilters.pageSize
    const pageCount =
      pageSize > 0 ? Math.ceil(total / pageSize) : total > 0 ? 1 : 0

    return {
      items,
      total,
      page,
      pageSize,
      pageCount,
    }
  }
}
