'use client'

import { Banknote } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { formatDate, formatDateTime } from '../../utils/format-date'
import type { AdminUserActivity } from '../../../_domain/user-detail'

export type ActivityTableRow = {
  type: 'paid' | 'last'
  date: string
  display: string
}

export const activityColumns: ColumnDef<ActivityTableRow>[] = [
  {
    header: 'Дата',
    accessorKey: 'date',
    cell: ({ row }) =>
      row.original.type === 'paid'
        ? formatDate(row.original.date)
        : formatDateTime(row.original.date),
  },
  {
    header: 'URL / Раздел',
    accessorKey: 'display',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.type === 'paid' ? (
          <Banknote className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : null}
        <span>{row.original.display}</span>
      </div>
    ),
  },
]

export const mapActivityToRows = (
  data: AdminUserActivity[],
  lastActivityAt: string | null
): ActivityTableRow[] => [
  {
    type: 'last',
    date: lastActivityAt ?? '',
    display: `Последняя активность: ${formatDateTime(lastActivityAt)}`,
  },
  ...data.map<ActivityTableRow>(entry => ({
    type: 'paid',
    date: entry.date,
    display: entry.path ?? entry.menu ?? 'Платный контент',
  })),
]
