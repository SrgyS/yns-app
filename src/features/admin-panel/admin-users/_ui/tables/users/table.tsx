'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { AdminUserListItem } from '../../../_domain/types'
import { Card, CardContent } from '@/shared/ui/card'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'

export function UsersTable({
  columns,
  data,
}: {
  columns: ColumnDef<AdminUserListItem, unknown>[]
  data: AdminUserListItem[]
}) {
  return (
    <AdminDataTable
      columns={columns}
      data={data}
      className="min-w-[900px]"
      emptyPlaceholder={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Пользователи не найдены
          </CardContent>
        </Card>
      }
    />
  )
}
