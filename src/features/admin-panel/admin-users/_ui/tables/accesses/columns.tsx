'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { formatDate } from '../../utils/format-date'
import { useAccessesTableContext } from './context'

const REASON_LABELS: Record<string, string> = {
  paid: 'Куплен',
  free: 'Бесплатно',
  manual: 'Выдан вручную',
}

export const accessColumns: ColumnDef<AdminUserAccess>[] = [
  {
    accessorKey: 'courseTitle',
    header: 'Курс',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-wrap">{row.original.courseTitle}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.contentType === 'SUBSCRIPTION'
            ? 'Подписка'
            : 'Фиксированный курс'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'period',
    header: 'Период',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      const start = row.original.startsAt
      const end = row.original.expiresAt
      const periodText = end
        ? `с ${formatDate(start)} по ${formatDate(end)}`
        : `с ${formatDate(start)} бессрочно`
      return (
        <div>
          <Badge variant={isActive ? 'secondary' : 'outline'}>
            {isActive ? 'Активен' : 'Завершён'}
          </Badge>
          <div className="mt-1 text-xs text-muted-foreground text-wrap">
            {periodText}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: 'Причина',
    cell: ({ row }) => (
      <span className="text-wrap">
        {REASON_LABELS[row.original.reason] ?? row.original.reason}
      </span>
    ),
  },
  {
    accessorKey: 'admin',
    header: 'Выдал',
    cell: ({ row }) => {
      const name = row.original.adminName ?? row.original.adminEmail
      return name ? <span className="text-wrap">{name}</span> : '—'
    },
  },
  {
    accessorKey: 'closedBy',
    header: 'Закрыл',
    cell: ({ row }) => {
      if (!row.original.closedAt) {
        return '—'
      }

      return (
        <>
          <div className="text-sm font-medium">
            {row.original.closedByName ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.closedAt)}
          </div>
        </>
      )
    },
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => <AccessActionsCell access={row.original} />,
  },
]

function AccessActionsCell({ access }: Readonly<{ access: AdminUserAccess }>) {
  const { canEditAccess, onClose, isClosing, closingAccessId } =
    useAccessesTableContext()

  const isActive = access.isActive
  const isClosingCurrent = isClosing && closingAccessId === access.id
  const canClose = canEditAccess && isActive && !isClosingCurrent

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Button variant="outline" size="sm" disabled>
        Продлить
      </Button>
      <Button variant="outline" size="sm" disabled>
        Изменить период
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={!canClose}
        onClick={() => onClose(access.id)}
      >
        {isClosingCurrent && <Spinner className="mr-2 size-3" />} Закрыть
      </Button>
    </div>
  )
}
