'use client'

import type { AdminUserAccess } from '../../../_domain/user-detail'
import { Card, CardContent } from '@/shared/ui/card'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { accessColumns } from './columns'

export function AccessesTable({ data }: Readonly<{ data: AdminUserAccess[] }>) {
  return (
    <AdminDataTable
      columns={accessColumns}
      data={data}
      emptyPlaceholder={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Доступы не найдены
          </CardContent>
        </Card>
      }
    />
  )
}
