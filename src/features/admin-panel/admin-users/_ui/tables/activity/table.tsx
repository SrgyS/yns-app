'use client'

import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { Card, CardContent } from '@/shared/ui/card'

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
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Активность не найдена
          </CardContent>
        </Card>
      }
    />
  )
}
