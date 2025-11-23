'use client'

import { formatDate } from '../utils/format-date'
import type { AdminUserActivity } from '../../_domain/user-detail'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { Card, CardContent } from '@/shared/ui/card'
import type { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<AdminUserActivity>[] = [
  {
    header: 'Дата',
    accessorKey: 'date',
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    header: 'URL / Раздел',
    accessorKey: 'path',
    cell: ({ row }) => row.original.path ?? row.original.menu ?? '—',
  },
]

export function ActivityTable({ data }: Readonly<{ data: AdminUserActivity[] }>) {
  return (
    <AdminDataTable
      columns={columns}
      data={data}
      emptyPlaceholder={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Активность не найдена
          </CardContent>
        </Card>
      }
    />
  )
}
