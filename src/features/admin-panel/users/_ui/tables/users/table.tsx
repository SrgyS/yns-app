'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { AdminUserListItem } from '../../../_domain/types'
import { AdminDataTable } from '@/shared/ui/data-table'

export function UsersTable({
  columns,
  data,
}: Readonly<{
  columns: ColumnDef<AdminUserListItem, unknown>[]
  data: AdminUserListItem[]
}>) {
  return (
    <AdminDataTable
      columns={columns}
      data={data}
      className="min-w-fit"
      emptyPlaceholder={
        <div className="py-10 text-center text-sm text-muted-foreground">
          Пользователи не найдены
        </div>
      }
    />
  )
}
