'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { AdminUserListItem, AdminUserListFilters } from '../../../_domain/types'
import { AdminDataTable } from '@/shared/ui/data-table'

import type { AdminUsersFilterKey } from '../../../_hooks/use-admin-users'

export function UsersTable({
  columns,
  data,
  filters,
  onFilterChange,
}: Readonly<{
  columns: ColumnDef<AdminUserListItem, unknown>[]
  data: AdminUserListItem[]
  filters: AdminUserListFilters
  onFilterChange: (key: AdminUsersFilterKey, value: string) => void
}>) {
  return (
    <AdminDataTable
      columns={columns}
      data={data}
      className="min-w-fit"
      meta={{ filters, onFilterChange }}
      emptyPlaceholder={
        <div className="py-10 text-center text-sm text-muted-foreground">
          Пользователи не найдены
        </div>
      }
    />
  )
}
