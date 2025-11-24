'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { Card } from '@/shared/ui/card'
import { Snowflake } from 'lucide-react'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { formatDate } from '../../utils/format-date'
import { useAccessesTableContext } from './context'
import { cn } from '@/shared/ui/utils'

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
    cell: ({ row }) => <PeriodCell access={row.original} />,
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
      {/* <Button variant="outline" size="sm" disabled>
        Изменить период
      </Button> */}
      <Button
        variant="destructive"
        size="sm"
        disabled={!canClose}
        className="hover:bg-destructive/80"
        onClick={() => onClose(access.id)}
      >
        {isClosingCurrent && <Spinner className="mr-2 size-2" />} Закрыть
      </Button>
    </div>
  )
}

function PeriodCell({ access }: Readonly<{ access: AdminUserAccess }>) {
  const { canEditAccess, onExtend } = useAccessesTableContext()
  const isActive = access.isActive
  const start = access.startsAt
  const end = access.expiresAt
  const periodText = end
    ? `с ${formatDate(start)} по ${formatDate(end)}`
    : `с ${formatDate(start)} бессрочно`

  const handleClick = () => {
    if (!canEditAccess) {
      return
    }
    onExtend({ id: access.id, expiresAt: access.expiresAt })
  }

  const now = Date.now()
  const isFrozenToday =
    isActive &&
    (access.freezes?.some(freeze => {
      const from = new Date(freeze.start).getTime()
      const to = new Date(freeze.end).getTime()
      const isCanceled = Boolean(freeze.canceledAt)
      return !isCanceled && from <= now && to >= now
    }) ??
      false)

  return (
    <Button
      asChild
      variant="ghost"
      onClick={handleClick}
      className="h-auto w-full p-0"
    >
      <Card
        tabIndex={canEditAccess && isActive ? 0 : -1}
        className={cn(
          'p-2 flex cursor-pointer flex-col gap-1  transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          !canEditAccess || !isActive ? 'pointer-events-none opacity-60' : '',
          isFrozenToday
            ? 'border-sky-500 hover:bg-sky-50 focus-visible:ring-sky-500'
            : isActive &&
                'border-green-500 hover:bg-green-50 focus-visible:ring-green-500'
        )}
      >
        {isFrozenToday && (
          <span className="flex items-center gap-1 text-xs self-start font-semibold text-sky-700">
            <Snowflake className="size-3" />
            Заморожен
          </span>
        )}
        <span>{periodText}</span>
      </Card>
    </Button>
  )
}
