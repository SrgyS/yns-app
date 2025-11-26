'use client'

import { AdminDataTable } from '@/shared/ui/data-table'

import type { AdminUserActivity } from '../../../_domain/user-detail'
import { activityColumns, mapActivityToRows } from './columns'

export function ActivityTable({
  data,
  lastActivityAt,
}: Readonly<{ data: AdminUserActivity[]; lastActivityAt: string | null }>) {
  const rows = mapActivityToRows(data, lastActivityAt)

  return (
    <AdminDataTable
      columns={activityColumns}
      data={rows}
      emptyPlaceholder={
        <div className="py-10 text-center text-sm text-muted-foreground">
          Активность не найдена
        </div>
      }
    />
  )
}
