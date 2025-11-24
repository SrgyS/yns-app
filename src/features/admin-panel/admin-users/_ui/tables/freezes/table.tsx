'use client'

import type { AdminUserFreeze } from '../../../_domain/user-detail'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { freezeColumns } from './columns'

type FreezeHistoryTableProps = {
  freezes: AdminUserFreeze[]
}

export function FreezeHistoryTable({
  freezes,
}: Readonly<FreezeHistoryTableProps>) {
  return (
    <AdminDataTable
      columns={freezeColumns}
      data={freezes}
      emptyPlaceholder={
        <div className="text-sm text-muted-foreground">
          История заморозок отсутствует.
        </div>
      }
      className="min-w-[640px]"
    />
  )
}
