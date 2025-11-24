'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { AdminUserFreeze } from '../../../_domain/user-detail'
import { formatDate, formatDateTime } from '../../utils/format-date'

export const freezeColumns: ColumnDef<AdminUserFreeze>[] = [
  {
    accessorKey: 'period',
    header: 'Период',
    cell: ({ row }) => (
      <div className="text-sm">
        {formatDate(row.original.start)} — {formatDate(row.original.end)}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Создана',
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: 'createdBy',
    header: 'Кем',
    cell: ({ row }) => row.original.createdBy ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const freeze = row.original
      if (freeze.canceledAt) {
        const canceledAt = formatDateTime(freeze.canceledAt)
        const canceledBy = freeze.canceledBy ? `, ${freeze.canceledBy}` : ''
        return `Отменена ${canceledAt}${canceledBy}`
      }
      return 'Активна'
    },
  },
]
